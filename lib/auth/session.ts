/*
 * ═══════════════════════════════════════════════════════════
 *   Sessions serveur — Drive-Path
 *
 *   Gère les sessions stockées dans la table Neon `sessions` et le
 *   cookie HttpOnly `dp_session` associé.
 *
 *   Architecture :
 *     Navigateur → cookie HttpOnly (token opaque, 64 hex)
 *       → serveur hash le token (SHA-256)
 *       → recherche tokenHash dans `sessions`
 *       → récupération de userId
 *       → récupération de l'utilisateur dans `users`
 *
 *   ⚠️  Le token brut n'est JAMAIS stocké dans Neon — uniquement son
 *   hash SHA-256 (colonne `sessions.tokenHash`). Le token brut n'existe
 *   que dans le cookie du navigateur et, côté serveur, le temps de
 *   l'appel qui le génère.
 *
 *   ⚠️  SERVEUR UNIQUEMENT — Utilise `next/headers` (cookies) et la DB.
 *   Ne jamais importer depuis un composant client.
 *
 *   ⚠️  État actuel (migration en cours) : ce module n'est branché que
 *   sur POST /api/auth/login. sessionStorage["dp_session"] continue
 *   d'être utilisé en parallèle par le reste de l'app — voir lib/auth/index.ts.
 * ═══════════════════════════════════════════════════════════
 */

import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db, schema } from "@/lib/database";

/** Nom du cookie HttpOnly contenant le token de session opaque. */
export const SESSION_COOKIE_NAME = "dp_session";

/** Durée de vie d'une session : 7 jours. */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1_000;

/** Utilisateur public — jamais de passwordHash. */
export type PublicUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

/* ── Génération / hash du token ────────────────────────── */

/** Génère un token de session opaque cryptographiquement aléatoire (32 octets → 64 car. hex). */
function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/** Hash SHA-256 du token — seule valeur stockée dans `sessions.token_hash`. */
function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/* ── Création de session ───────────────────────────────── */

/**
 * Crée une session serveur pour l'utilisateur donné :
 *   1. génère un token opaque
 *   2. stocke uniquement son hash SHA-256 dans `sessions` (jamais le token brut)
 *   3. pose le cookie HttpOnly `dp_session` contenant le token brut
 *
 * À appeler uniquement après une authentification réussie.
 */
export async function createSession(userId: string): Promise<void> {
  const token     = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(schema.sessions).values({
    userId,
    tokenHash,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/* ── Lecture de l'utilisateur courant ──────────────────── */

/**
 * Lit le cookie `dp_session`, vérifie la session en base et retourne
 * l'utilisateur associé (sans passwordHash).
 *
 * Retourne `null` si le cookie est absent, la session introuvable,
 * ou la session expirée.
 *
 * ⚠️  Pas encore utilisée dans les pages/middleware à cette étape.
 */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashSessionToken(token);

  const rows = await db
    .select({
      id:        schema.users.id,
      email:     schema.users.email,
      firstName: schema.users.firstName,
      lastName:  schema.users.lastName,
      role:      schema.users.role,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(and(
      eq(schema.sessions.tokenHash, tokenHash),
      gt(schema.sessions.expiresAt, new Date()),
    ))
    .limit(1);

  return rows[0] ?? null;
}

/* ── Suppression / invalidation ────────────────────────── */

/**
 * Invalide une session : supprime la ligne correspondante dans `sessions`
 * et efface le cookie `dp_session`.
 *
 * Sans argument, invalide la session du cookie courant (usage futur —
 * ex. logout). Un token explicite peut être passé pour invalider une
 * session précise.
 *
 * ⚠️  Pas encore appelée par logout() à cette étape — fonction prête
 * pour l'intégration future.
 */
export async function invalidateSession(token?: string): Promise<void> {
  const cookieStore = await cookies();
  const targetToken = token ?? cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (targetToken) {
    const tokenHash = hashSessionToken(targetToken);
    await db.delete(schema.sessions).where(eq(schema.sessions.tokenHash, tokenHash));
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}
