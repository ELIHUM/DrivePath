/*
 * ═══════════════════════════════════════════════════════════
 *   OTP Store — Stockage persistant Neon
 *
 *   Remplace l'ancien stockage en mémoire (Maps globalThis) par la
 *   table Neon `reset_tokens` (lib/database/schema.ts, déjà conçue
 *   pour ça — inchangée à cette étape, aucune migration nécessaire).
 *
 *   Deux types de lignes dans `reset_tokens` :
 *     • "otp"   — Code à 6 chiffres envoyé par email (TTL 10 min).
 *     • "reset" — Token opaque émis après OTP validé (TTL 15 min).
 *
 *   SÉCURITÉ :
 *   - Ni le code OTP ni le reset token ne sont jamais stockés en clair —
 *     seul leur hash SHA-256 (tokenHash) est écrit en base.
 *   - usedAt : null = pas encore utilisé. Une ligne utilisée ou expirée
 *     ne peut plus être validée (usage unique).
 *   - Même API exposée qu'avant (mêmes noms de fonctions) — seules les
 *     routes appelantes ont besoin d'ajouter `await` (fonctions désormais
 *     asynchrones, car elles interrogent Neon).
 *
 *   ⚠️  SERVEUR UNIQUEMENT — Ne jamais importer depuis un composant client.
 * ═══════════════════════════════════════════════════════════
 */

import { randomBytes, createHash } from "crypto";
import { and, desc, eq, gt, isNull, lt, sql } from "drizzle-orm";
import { db, schema } from "@/lib/database";

export const OTP_TTL_MS         = 10 * 60 * 1_000;  // 10 minutes
export const RESET_TOKEN_TTL_MS = 15 * 60 * 1_000;  // 15 min pour changer le mot de passe
export const OTP_COOLDOWN_MS    = 60 * 1_000;        // 60 s entre deux envois
export const OTP_MAX_ATTEMPTS   = 5;                 // essais par code avant invalidation

export type VerifyOTPResult = "valid" | "invalid" | "expired" | "used" | "locked";

/* ── Hash (jamais de valeur brute en base) ─────────────── */

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/* ── OTP ───────────────────────────────────────────────── */

/** Génère un code OTP à 6 chiffres cryptographiquement aléatoire. */
export function generateOTPCode(): string {
  const num = randomBytes(4).readUInt32BE(0) % 1_000_000;
  return String(num).padStart(6, "0");
}

/** Ligne "otp" la plus récente pour un email — fait office d'entrée unique par email. */
async function getLatestOtpRow(email: string) {
  const normalized = email.toLowerCase().trim();
  const rows = await db
    .select({
      id:        schema.resetTokens.id,
      tokenHash: schema.resetTokens.tokenHash,
      expiresAt: schema.resetTokens.expiresAt,
      usedAt:    schema.resetTokens.usedAt,
      attempts:  schema.resetTokens.attempts,
      createdAt: schema.resetTokens.createdAt,
    })
    .from(schema.resetTokens)
    .where(and(
      eq(schema.resetTokens.email, normalized),
      eq(schema.resetTokens.type, "otp"),
    ))
    .orderBy(desc(schema.resetTokens.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Stocke un OTP pour l'adresse email donnée (hash uniquement).
 * Retourne le timestamp d'envoi (sentAt) pour le cooldown côté client.
 */
export async function storeOTP(email: string, code: string): Promise<number> {
  const normalized = email.toLowerCase().trim();
  const sentAt = Date.now();

  await db.insert(schema.resetTokens).values({
    email:     normalized,
    tokenHash: hashValue(code),
    type:      "otp",
    expiresAt: new Date(sentAt + OTP_TTL_MS),
  });

  return sentAt;
}

/**
 * Retourne le délai restant avant de pouvoir renvoyer (en ms).
 * Retourne 0 si le cooldown est écoulé ou s'il n'y a pas d'entrée.
 */
export async function getCooldownRemainingMs(email: string): Promise<number> {
  const row = await getLatestOtpRow(email);
  if (!row) return 0;
  const remaining = OTP_COOLDOWN_MS - (Date.now() - row.createdAt.getTime());
  return remaining > 0 ? remaining : 0;
}

/**
 * Vérifie un code OTP contre le dernier code envoyé pour cet email,
 * avec au plus OTP_MAX_ATTEMPTS essais par code. Un code valide est
 * consommé (usedAt posé) dans la même opération.
 *
 * Concurrence : chaque essai réserve d'abord sa place par un UPDATE
 * atomique (attempts + 1 WHERE attempts < max AND usedAt IS NULL AND
 * non expiré). PostgreSQL verrouille la ligne pendant l'UPDATE et
 * réévalue la condition : des requêtes simultanées ne peuvent jamais
 * obtenir plus de OTP_MAX_ATTEMPTS comparaisons de hash au total, et
 * une ligne verrouillée ou consommée ne peut plus être acceptée.
 */
export async function verifyOTPCode(email: string, code: string): Promise<VerifyOTPResult> {
  const row = await getLatestOtpRow(email);
  if (!row) return "invalid";
  if (row.attempts >= OTP_MAX_ATTEMPTS) return "locked";
  if (row.usedAt) return "used";
  if (Date.now() > row.expiresAt.getTime()) return "expired";

  /* ── Réserver un essai (atomique) ───────────────────── */
  const claimed = await db
    .update(schema.resetTokens)
    .set({ attempts: sql`${schema.resetTokens.attempts} + 1` })
    .where(and(
      eq(schema.resetTokens.id, row.id),
      isNull(schema.resetTokens.usedAt),
      gt(schema.resetTokens.expiresAt, new Date()),
      lt(schema.resetTokens.attempts, OTP_MAX_ATTEMPTS),
    ))
    .returning({ attempts: schema.resetTokens.attempts });

  const attempt = claimed[0];
  if (!attempt) {
    // Une requête concurrente a verrouillé, consommé ou laissé expirer le code.
    const current = await getLatestOtpRow(email);
    if (!current || current.id !== row.id) return "invalid";
    if (current.attempts >= OTP_MAX_ATTEMPTS) return "locked";
    if (current.usedAt) return "used";
    return "expired";
  }

  /* ── Code correct : consommation atomique (usage unique) ── */
  if (hashValue(code.trim()) === row.tokenHash) {
    const consumed = await db
      .update(schema.resetTokens)
      .set({ usedAt: new Date() })
      .where(and(
        eq(schema.resetTokens.id, row.id),
        isNull(schema.resetTokens.usedAt),
      ))
      .returning({ id: schema.resetTokens.id });
    return consumed.length > 0 ? "valid" : "used";
  }

  /* ── Code incorrect : invalidation au dernier essai autorisé ── */
  if (attempt.attempts >= OTP_MAX_ATTEMPTS) {
    await db
      .update(schema.resetTokens)
      .set({ usedAt: new Date() })
      .where(and(
        eq(schema.resetTokens.id, row.id),
        isNull(schema.resetTokens.usedAt),
      ));
    return "locked";
  }
  return "invalid";
}

/** Marque le dernier OTP envoyé à cet email comme utilisé (ne peut plus être vérifié). */
export async function markOTPUsed(email: string): Promise<void> {
  const row = await getLatestOtpRow(email);
  if (!row) return;
  await db
    .update(schema.resetTokens)
    .set({ usedAt: new Date() })
    .where(eq(schema.resetTokens.id, row.id));
}

/* ── Reset Token ───────────────────────────────────────── */
/*  Émis par le serveur après vérification OTP réussie.    */
/*  Prouve que l'OTP a été validé sans exposer le code.   */

/** Génère un token opaque de 64 caractères hex. */
export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

/** Stocke un reset token associé à un email (hash uniquement — jamais le token brut). */
export async function storeResetToken(token: string, email: string): Promise<void> {
  await db.insert(schema.resetTokens).values({
    email:     email.toLowerCase().trim(),
    tokenHash: hashValue(token),
    type:      "reset",
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  });
}

/**
 * Vérifie et consomme un reset token (usage unique).
 * Retourne l'email associé si le token est valide.
 *
 * Implémenté comme un UPDATE ... WHERE usedAt IS NULL AND expiresAt > now()
 * ... RETURNING atomique : deux requêtes concurrentes avec le même token ne
 * peuvent pas toutes les deux réussir (la seconde ne matche plus aucune
 * ligne dès que la première a posé usedAt).
 */
export async function verifyAndConsumeResetToken(
  token: string,
): Promise<{ ok: true; email: string } | { ok: false }> {
  const tokenHash = hashValue(token);
  const now = new Date();

  const rows = await db
    .update(schema.resetTokens)
    .set({ usedAt: now })
    .where(and(
      eq(schema.resetTokens.tokenHash, tokenHash),
      eq(schema.resetTokens.type, "reset"),
      isNull(schema.resetTokens.usedAt),
      gt(schema.resetTokens.expiresAt, now),
    ))
    .returning({ email: schema.resetTokens.email });

  const row = rows[0];
  return row ? { ok: true, email: row.email } : { ok: false };
}
