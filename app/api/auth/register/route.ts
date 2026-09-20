import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/database";
import { hashPasswordArgon2 } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/register
   Body : { email, password, firstName, lastName }

   Crée un nouvel utilisateur dans Neon.
   Le mot de passe est hashé côté serveur — jamais stocké en clair.

   SÉCURITÉ :
   - L'email est normalisé (trim + lowercase) avant insertion.
   - L'unicité de l'email est vérifiée avant insertion.
   - Aucun mot de passe ni hash n'est retourné dans la réponse.

   ALGORITHME DE HASH :
   Argon2id (via hashPasswordArgon2() — lib/auth/password.ts) pour tout
   nouveau compte. Le hash stocké est auto-descriptif ("$argon2id$...").
   ⚠️  Les comptes existants créés avant cette étape ont encore un hash
   SHA-256 legacy — ils restent gérés par lib/auth/password.ts
   (hashPassword()/verifyPassword()) tant que login/reset-password n'ont
   pas été migrés (prochaine étape).

   SESSION (nouveau) :
   Une inscription réussie crée immédiatement une session serveur
   (createSession() — cookie HttpOnly dp_session + table Neon `sessions`),
   exactement comme /api/auth/login. Nécessaire car le parcours
   d'inscription moniteur (app/instructor/register/*) enregistre ensuite
   le profil dans Neon (POST /api/instructor/profile) en s'appuyant sur
   l'utilisateur authentifié côté serveur — sans cette session, aucune
   route ne pourrait déterminer en sécurité à quel compte rattacher le
   profil soumis à la fin du formulaire.
═══════════════════════════════════════════════════════════ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
    };

    const email     = (body.email     ?? "").toLowerCase().trim();
    const password  =  body.password   ?? "";
    const firstName = (body.firstName ?? "").trim();
    const lastName  = (body.lastName  ?? "").trim();

    /* ── Validation serveur ────────────────────────────── */

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ ok: false, error: "invalid_password" }, { status: 400 });
    }
    if (!firstName || !lastName) {
      return NextResponse.json({ ok: false, error: "invalid_name" }, { status: 400 });
    }

    /* ── Unicité de l'email ────────────────────────────── */

    const existing = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ ok: false, error: "email_exists" });
    }

    /* ── Hash côté serveur (Argon2id) ──────────────────── */

    const passwordHash = await hashPasswordArgon2(password);

    /* ── Insertion dans Neon ───────────────────────────── */

    const inserted = await db.insert(schema.users).values({
      email,
      passwordHash,
      firstName,
      lastName,
      role: "instructor",
    }).returning({ id: schema.users.id });

    const newUser = inserted[0];

    /* ── Session serveur immédiate (auto-login) ────────── */

    if (newUser) {
      await createSession(newUser.id);
    }

    // Ne retourner ni mot de passe ni hash
    return NextResponse.json({ ok: true });

  } catch (err) {
    // Contrainte d'unicité (race condition entre deux requêtes simultanées)
    if (err != null && typeof err === "object" && "code" in err && (err as { code: unknown }).code === "23505") {
      return NextResponse.json({ ok: false, error: "email_exists" });
    }
    console.error("[register] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
