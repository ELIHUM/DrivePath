import { NextRequest, NextResponse } from "next/server";
import {
  verifyOTPCode,
  generateResetToken, storeResetToken,
} from "@/lib/otp-store";

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/verify-reset-code
   Body : { email: string, code: string }

   Vérifie le code OTP côté serveur.
   Si valide : marque l'OTP comme utilisé et émet un reset token.
   Le reset token prouve que l'OTP a été validé et autorise
   le changement de mot de passe via /api/auth/reset-password.

   SÉCURITÉ :
   - Le code OTP est vérifié côté serveur uniquement.
   - Le vrai code n'est jamais retourné au client.
   - Le reset token est opaque (64 chars hex aléatoires).
   - Chaque reset token est à usage unique et expire en 15 minutes.
   - Au plus 5 essais par code (OTP_MAX_ATTEMPTS, lib/otp-store.ts) :
     au 5e échec le code est invalidé et la réponse devient "locked" —
     un nouveau code doit être demandé. Le compteur et la consommation
     du code valide sont atomiques (voir verifyOTPCode()).
═══════════════════════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: string; code?: string };
    const email = (body.email ?? "").toLowerCase().trim();
    const code  = (body.code  ?? "").trim();

    if (!email || !code || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
    }

    const result = await verifyOTPCode(email, code);

    if (result !== "valid") {
      // Motif d'erreur pour l'affichage client (expired, used, invalid, locked)
      return NextResponse.json({ ok: false, error: result });
    }

    // OTP valide — déjà consommé atomiquement par verifyOTPCode() (usage unique)

    // Émettre un reset token opaque (preuve de vérification OTP)
    const resetToken = generateResetToken();
    await storeResetToken(resetToken, email);

    return NextResponse.json({ ok: true, resetToken });
  } catch (err) {
    console.error("[verify-reset-code] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: "invalid" });
  }
}
