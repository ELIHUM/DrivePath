import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/database";
import { verifyAndConsumeResetToken } from "@/lib/otp-store";
import { hashPasswordArgon2 } from "@/lib/auth/password";

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/reset-password
   Body : { resetToken: string, newPassword: string }

   Valide le reset token (preuve de vérification OTP), puis met à jour
   directement users.password_hash dans Neon avec un hash Argon2id.

   Le mot de passe réinitialisé est désormais effectif sur le vrai compte
   Neon — le flux ne dépend plus de localStorage pour ça (voir aussi
   app/forgot-password/reset/page.tsx, adapté a minima pour ne plus
   attendre de hash dans la réponse).

   SÉCURITÉ :
   - Le reset token est opaque, à usage unique et expire — voir
     verifyAndConsumeResetToken() dans lib/otp-store.ts (désormais
     persisté dans Neon, table `reset_tokens` — voir schema.ts).
   - Sans reset token valide, le changement de mot de passe est refusé.
   - Le nouveau mot de passe est hashé en Argon2id côté serveur —
     jamais via l'ancien SHA-256 legacy, jamais stocké en clair.
   - Le hash n'est jamais inclus dans la réponse JSON : seul { ok: true }
     confirme la réussite.
   - Aucune erreur interne Neon n'est renvoyée au client.
   - Une fois le mot de passe changé, TOUTES les sessions existantes de
     ce compte (table `sessions`) sont supprimées — déconnecte les autres
     appareils/navigateurs. Un échec de cette suppression ne prétend
     jamais être un succès (voir gestion d'erreur dédiée ci-dessous).

   ⚠️  Limite connue : verifyAndConsumeResetToken() consomme le token dès
   qu'il est valide (vérification + consommation en un seul UPDATE ...
   RETURNING atomique). Si la mise à jour Neon échoue ensuite (cas rare
   — compte introuvable, erreur réseau), le token est déjà consommé et
   l'utilisateur doit relancer la procédure de réinitialisation.
═══════════════════════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { resetToken?: string; newPassword?: string };
    const { resetToken, newPassword } = body;

    if (!resetToken || !newPassword || newPassword.length < 8) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Vérifier et consommer le reset token (usage unique)
    const tokenResult = await verifyAndConsumeResetToken(resetToken);
    if (!tokenResult.ok) {
      return NextResponse.json({ ok: false, error: "token_invalid" });
    }

    /* ── Récupérer l'utilisateur Neon correspondant ────── */

    const rows = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, tokenResult.email))
      .limit(1);

    const user = rows[0];

    // Compte introuvable dans Neon pour cet email — ne pas exposer de détail.
    if (!user) {
      return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
    }

    /* ── Hash Argon2id + mise à jour Neon ──────────────── */

    const newPasswordHash = await hashPasswordArgon2(newPassword);

    await db
      .update(schema.users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(schema.users.id, user.id));

    /* ── Révoquer toutes les sessions existantes de ce compte ─── */
    /* Le mot de passe vient d'être changé — un échec ici ne doit    */
    /* jamais être présenté comme un succès au client.               */

    try {
      await db.delete(schema.sessions).where(eq(schema.sessions.userId, user.id));
    } catch (sessionErr) {
      console.error(
        "[reset-password] Mot de passe changé mais révocation des sessions échouée:",
        sessionErr,
      );
      return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
    }

    // Ne jamais retourner le hash — seule la confirmation compte.
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[reset-password] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
