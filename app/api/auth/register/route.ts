import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/database";

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/register
   Body : { email, password, firstName, lastName }

   Crée un nouvel utilisateur dans Neon.
   Le mot de passe est hashé côté serveur — jamais stocké en clair.

   SÉCURITÉ :
   - L'email est normalisé (trim + lowercase) avant insertion.
   - L'unicité de l'email est vérifiée avant insertion.
   - Aucun mot de passe ni hash n'est retourné dans la réponse.

   ALGORITHME DE HASH (temporaire) :
   SHA-256 avec préfixe statique "dp2024:" — identique au hash
   client dans lib/auth/index.ts — maintenu pour compatibilité
   avec le login localStorage actuel.
   ⚠️  À remplacer par bcrypt/Argon2 lors de l'étape 3 de migration.
═══════════════════════════════════════════════════════════ */

/**
 * Hash SHA-256 côté serveur — identique à hashPassword() dans lib/auth/index.ts.
 * ⚠️  Ne pas modifier indépendamment du client avant l'étape de migration du hash.
 */
function hashPassword(password: string): string {
  return createHash("sha256").update(`dp2024:${password}`).digest("hex");
}

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

    /* ── Hash côté serveur ─────────────────────────────── */

    const passwordHash = hashPassword(password);

    /* ── Insertion dans Neon ───────────────────────────── */

    await db.insert(schema.users).values({
      email,
      passwordHash,
      firstName,
      lastName,
      role: "instructor",
    });

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
