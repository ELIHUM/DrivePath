import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/database";
import { createSession } from "@/lib/auth/session";

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

   ALGORITHME DE HASH (temporaire) :
   SHA-256 avec préfixe statique "dp2024:" — identique au hash utilisé
   par /api/auth/register et par lib/auth/index.ts.
   ⚠️  À remplacer par bcrypt/Argon2 lors de l'étape 3 de migration.

   SESSION SERVEUR (nouveau) :
   Une authentification réussie crée désormais une session Neon
   (table `sessions`) et pose le cookie HttpOnly `dp_session` — voir
   lib/auth/session.ts. Le token de session n'est jamais retourné dans
   le corps JSON de la réponse (uniquement via le cookie Set-Cookie).

   ⚠️  TEMPORAIRE — Le frontend (lib/auth/index.ts → tryLogin) continue
   en parallèle d'utiliser sessionStorage["dp_session"] pour ne pas
   casser le reste de l'app. Les deux mécanismes coexistent pour l'instant.
═══════════════════════════════════════════════════════════ */

/**
 * Hash SHA-256 côté serveur — identique à hashPassword() dans
 * lib/auth/index.ts et app/api/auth/register/route.ts.
 * ⚠️  Ne pas modifier indépendamment avant l'étape de migration du hash.
 */
function hashPassword(password: string): string {
  return createHash("sha256").update(`dp2024:${password}`).digest("hex");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: string; password?: string };

    const email    = (body.email    ?? "").toLowerCase().trim();
    const password =  body.password ?? "";

    if (!email || !EMAIL_RE.test(email) || !password) {
      return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 400 });
    }

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

    // Email inexistant → même erreur générique que mot de passe incorrect
    if (!user) {
      return NextResponse.json({ ok: false, error: "invalid_credentials" });
    }

    /* ── Vérification du mot de passe ──────────────────── */

    const passwordHash = hashPassword(password);
    if (passwordHash !== user.passwordHash) {
      return NextResponse.json({ ok: false, error: "invalid_credentials" });
    }

    /* ── Succès — créer la session serveur + cookie HttpOnly ─ */

    await createSession(user.id);

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
