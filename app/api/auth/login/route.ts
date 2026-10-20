import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/database";
import { createSession } from "@/lib/auth/session";
import {
  verifyPassword, verifyDummyPassword, hashPasswordArgon2, isLegacyPasswordHash,
} from "@/lib/auth/password";
import {
  EMAIL_FAILURE_LIMIT, IP_FAILURE_LIMIT,
  emailKey, ipKey, getTrustedClientIp,
  reserveAttempt, releaseAttempt, maybePurgeExpiredAttempts,
  type Reservation,
} from "@/lib/auth/login-rate-limit";

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/login
   Body : { email, password }

   Vérifie les identifiants contre la table `users` dans Neon.
   Neon est désormais la source de vérité pour l'authentification.

   SÉCURITÉ :
   - L'email est normalisé (trim + lowercase) avant la recherche.
   - Email inexistant ET mot de passe incorrect renvoient exactement
     la même erreur générique ("invalid_credentials") — on ne révèle
     jamais si un email est enregistré ou non.
   - password_hash n'est jamais inclus dans la réponse.

   HASHAGE (migration progressive — étape 4) :
   verifyPassword() (lib/auth/password.ts) accepte les deux formats :
   ancien SHA-256 "dp2024:" (comptes créés avant la migration) et
   Argon2id "$argon2id$..." (nouveaux comptes depuis /api/auth/register).
   Après une authentification réussie sur un hash encore legacy, le
   mot de passe déjà vérifié est immédiatement re-hashé en Argon2id et
   écrit dans Neon — migration transparente, sans action de l'utilisateur.

   SESSION SERVEUR (nouveau) :
   Une authentification réussie crée désormais une session Neon
   (table `sessions`) et pose le cookie HttpOnly `dp_session` — voir
   lib/auth/session.ts. Le token de session n'est jamais retourné dans
   le corps JSON de la réponse (uniquement via le cookie Set-Cookie).

   ⚠️  TEMPORAIRE — Le frontend (lib/auth/index.ts → tryLogin) continue
   en parallèle d'utiliser sessionStorage["dp_session"] pour ne pas
   casser le reste de l'app. Les deux mécanismes coexistent pour l'instant.

   LIMITATION DES TENTATIVES (H1) — lib/auth/login-rate-limit.ts :
   - 5 tentatives non réussies / 15 min par email normalisé (toujours),
     20 / 15 min par IP (seulement si AUTH_CLIENT_IP_SOURCE est fiable).
   - Limite atteinte → 429 { ok: false, error: "too_many_attempts",
     retryAfter } + en-tête Retry-After, sans vérifier le mot de passe.
     Réponse identique que la limite soit email ou IP, et que le compte
     existe ou non.
   - Email inconnu → vérification Argon2id factice (verifyDummyPassword)
     pour ne pas répondre plus vite qu'un mauvais mot de passe.
   - Connexion réussie → les tentatives réservées sont rendues.
═══════════════════════════════════════════════════════════ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function tooManyAttempts(retryAfterSeconds: number) {
  return NextResponse.json(
    { ok: false, error: "too_many_attempts", retryAfter: retryAfterSeconds },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: string; password?: string };

    const email    = (body.email    ?? "").toLowerCase().trim();
    const password =  body.password ?? "";

    if (!email || !EMAIL_RE.test(email) || !password) {
      return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 400 });
    }

    /* ── Limitation (H1) : IP d'abord, puis email ──────── */
    /* Une IP bloquée n'incrémente pas le compteur de l'email ciblé. */

    await maybePurgeExpiredAttempts();

    const reservations: Reservation[] = [];

    const clientIp = getTrustedClientIp(req.headers);
    if (clientIp) {
      const ipResult = await reserveAttempt(ipKey(clientIp), IP_FAILURE_LIMIT);
      if (!ipResult.allowed) return tooManyAttempts(ipResult.retryAfterSeconds);
      reservations.push(ipResult.reservation);
    }

    const emailResult = await reserveAttempt(emailKey(email), EMAIL_FAILURE_LIMIT);
    if (!emailResult.allowed) return tooManyAttempts(emailResult.retryAfterSeconds);
    reservations.push(emailResult.reservation);

    /* ── Recherche de l'utilisateur ────────────────────── */

    const rows = await db
      .select({
        id:           schema.users.id,
        email:        schema.users.email,
        passwordHash: schema.users.passwordHash,
        firstName:    schema.users.firstName,
        lastName:     schema.users.lastName,
        role:         schema.users.role,
      })
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    const user = rows[0];

    // Email inexistant → même erreur générique que mot de passe incorrect,
    // après le même coût Argon2id qu'une vraie vérification.
    if (!user) {
      await verifyDummyPassword(password);
      return NextResponse.json({ ok: false, error: "invalid_credentials" });
    }

    /* ── Vérification du mot de passe (legacy SHA-256 ou Argon2id) ── */

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json({ ok: false, error: "invalid_credentials" });
    }

    /* ── Migration transparente : hash legacy → Argon2id ───────── */
    /* Le mot de passe vient d'être vérifié correct. Un échec d'écriture */
    /* ici ne doit jamais faire échouer un login par ailleurs valide.   */

    if (isLegacyPasswordHash(user.passwordHash)) {
      try {
        const upgradedHash = await hashPasswordArgon2(password);
        await db
          .update(schema.users)
          .set({ passwordHash: upgradedHash })
          .where(eq(schema.users.id, user.id));
      } catch (migrationErr) {
        console.error("[login] Password hash migration failed:", migrationErr);
        // Ne pas bloquer le login : l'authentification a déjà réussi.
      }
    }

    /* ── Succès — créer la session serveur + cookie HttpOnly ─ */

    await createSession(user.id);

    /* ── Succès : rendre les tentatives réservées (H1) ─────────── */
    /* Un échec ici ne doit jamais faire échouer un login réussi.   */
    try {
      await Promise.all(reservations.map(releaseAttempt));
    } catch (releaseErr) {
      console.error("[login] Restitution des tentatives échouée:", releaseErr);
    }

    /* Ne jamais retourner passwordHash ni le token de session. */

    return NextResponse.json({
      ok: true,
      user: {
        id:        user.id,
        email:     user.email,
        firstName: user.firstName,
        lastName:  user.lastName,
        role:      user.role,
      },
    });

  } catch (err) {
    console.error("[login] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
