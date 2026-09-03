import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { verifyAndConsumeResetToken } from "@/lib/otp-store";

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/reset-password
   Body : { resetToken: string, newPassword: string }

   Valide le reset token (preuve de vérification OTP) et retourne
   le hash du nouveau mot de passe pour mise à jour côté client.

   IMPORTANT — Architecture temporaire (prototype sans base de données) :
   Le mot de passe est stocké dans localStorage du navigateur.
   Le serveur valide le token, hash le mot de passe, et retourne le hash.
   Le client applique le hash à son stockage local.

   ⚠️  TODO (étape 3 du plan de migration) :
   - Stocker et mettre à jour le mot de passe directement en base de données
   - Remplacer SHA-256 par bcrypt ou Argon2
   - Ne plus retourner le hash au client

   SÉCURITÉ :
   - Le reset token est à usage unique (consommé ici).
   - Sans reset token valide, le changement de mot de passe est refusé.
   - Le nouveau mot de passe est hashé côté serveur avant tout retour.
═══════════════════════════════════════════════════════════ */

/**
 * Hash SHA-256 avec le même sel que le client (dp2024:).
 * ⚠️  Identique à hashPassword() dans lib/auth/index.ts — ne pas modifier
 * indépendamment avant l'étape de migration du hashage (étape 3).
 */
function hashPassword(password: string): string {
  return createHash("sha256").update(`dp2024:${password}`).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { resetToken?: string; newPassword?: string };
    const { resetToken, newPassword } = body;

    if (!resetToken || !newPassword || newPassword.length < 8) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Vérifier et consommer le reset token (usage unique)
    const tokenResult = verifyAndConsumeResetToken(resetToken);
    if (!tokenResult.ok) {
      return NextResponse.json({ ok: false, error: "token_invalid" });
    }

    // Hasher le nouveau mot de passe côté serveur
    const newPasswordHash = hashPassword(newPassword);

    // Retourner le hash pour mise à jour localStorage (prototype sans DB)
    return NextResponse.json({ ok: true, newPasswordHash });
  } catch (err) {
    console.error("[reset-password] Unexpected error:", err);
    return NextResponse.json({ ok: false });
  }
}
