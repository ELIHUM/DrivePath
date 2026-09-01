import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/reset-code
   Body : { email: string, code: string }

   Envoie le code de réinitialisation par e-mail.
   - Si RESEND_API_KEY est défini : envoi via Resend.
   - Sinon (développement) : log console + devCode dans la réponse.

   SÉCURITÉ : toujours répondre { ok: true } pour ne pas
   révéler si un compte existe.
═══════════════════════════════════════════════════════════ */

const RESEND_KEY   = process.env.RESEND_API_KEY;
const FROM_EMAIL   = process.env.RESET_FROM_EMAIL ?? "Drive-Path <noreply@drive-path.ca>";
const IS_DEV       = process.env.NODE_ENV === "development";

/* ── Template e-mail ───────────────────────────────────── */

function buildEmailHtml(code: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>Réinitialisation de mot de passe — Drive-Path</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f5f7;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation"
        style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

        <!-- En-tête -->
        <tr><td style="background:#0f2b5b;padding:32px 40px;text-align:center;">
          <p style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Drive-Path</p>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.55);font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:1.5px;">Plateforme moniteur</p>
        </td></tr>

        <!-- Corps -->
        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 16px;color:#0f2b5b;font-size:22px;font-weight:700;line-height:1.3;">
            Réinitialisation de mot de passe
          </h1>
          <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.7;">
            Nous avons reçu une demande de réinitialisation du mot de passe associé à votre compte Drive-Path.
            Utilisez le code ci-dessous pour créer un nouveau mot de passe.
          </p>

          <!-- Code -->
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
            <tr><td style="background:#f4f5f7;border-radius:12px;padding:28px 20px;text-align:center;">
              <p style="margin:0 0 10px;color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Votre code de vérification</p>
              <p style="margin:0;color:#0f2b5b;font-size:44px;font-weight:800;letter-spacing:12px;line-height:1;">${code}</p>
            </td></tr>
          </table>

          <p style="margin:0 0 28px;color:#6b7280;font-size:14px;line-height:1.7;">
            Ce code est valide pendant <strong style="color:#374151;">10 minutes</strong> à compter de la réception de cet e-mail.
            Ne le partagez avec personne.
          </p>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />

          <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.7;">
            Si vous n'avez pas demandé la réinitialisation de votre mot de passe, vous pouvez ignorer
            cet e-mail en toute sécurité. Votre mot de passe ne sera pas modifié.
          </p>
        </td></tr>

        <!-- Pied de page -->
        <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;">
          <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;line-height:1.6;">
            Drive-Path · Nouveau-Brunswick, Canada<br />
            <span style="font-size:11px;">Cet e-mail a été envoyé automatiquement, merci de ne pas y répondre.</span>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ── Handler ───────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: string; code?: string };
    const email = (body.email ?? "").toLowerCase().trim();
    const code  = (body.code  ?? "").trim();

    if (!email || !code || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const html = buildEmailHtml(code);
    const subject = "Votre code de réinitialisation Drive-Path";

    if (RESEND_KEY) {
      /* ── Envoi réel via Resend HTTP API ── */
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_KEY}`,
        },
        body: JSON.stringify({ from: FROM_EMAIL, to: [email], subject, html }),
      });
      if (!res.ok) {
        console.error("[reset-code] Resend error:", await res.text());
      }
    } else {
      /* ── Mode développement : log dans le terminal ── */
      console.log(
        `\n╔══════════════════════════════════════╗` +
        `\n║  Drive-Path — Code de réinitialisation ║` +
        `\n╠══════════════════════════════════════╣` +
        `\n║  Destinataire : ${email.padEnd(22)}║` +
        `\n║  Code         : ${code.padEnd(22)}║` +
        `\n║  Validité     : 10 minutes           ║` +
        `\n╚══════════════════════════════════════╝\n`,
      );
    }

    /* Toujours répondre ok : true (sécurité : ne pas révéler si le compte existe) */
    const response: { ok: boolean; devCode?: string } = { ok: true };

    /* En développement sans Resend : inclure le code dans la réponse pour les tests */
    if (IS_DEV && !RESEND_KEY) {
      response.devCode = code;
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error("[reset-code] Unexpected error:", err);
    return NextResponse.json({ ok: true }); // Ne jamais révéler l'erreur
  }
}
