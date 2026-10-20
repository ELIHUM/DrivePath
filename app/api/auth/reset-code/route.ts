import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/database";
import {
  generateOTPCode, storeOTP, getCooldownRemainingMs, markOTPUsed,
} from "@/lib/otp-store";

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/reset-code
   Body : { email: string }

   Génère un code OTP côté serveur, l'envoie par e-mail via Resend.
   Le code n'est JAMAIS retourné dans la réponse HTTP.

   SÉCURITÉ :
   - Toujours répondre { ok: true } pour ne pas révéler si un compte existe.
   - Le code est généré et stocké côté serveur uniquement.
   - Le client n'envoie plus le code — il reçoit uniquement sentAt pour le cooldown.

   COMPTE INEXISTANT (nouveau) :
   L'existence du compte est vérifiée dans Neon (table `users`) AVANT toute
   génération de code. Une adresse sans compte ne produit désormais :
     • aucune ligne dans `reset_tokens` ;
     • aucun code OTP généré ;
     • aucun appel à l'API Resend.
   Elle reçoit exactement la même réponse qu'une demande valide — même
   statut HTTP, mêmes champs, même valeur de `sentAt` — afin que la
   réponse ne permette pas de distinguer un compte existant d'un compte
   inexistant. La vérification est strictement serveur : rien de ce que
   le navigateur envoie n'intervient dans cette décision, hormis
   l'adresse elle-même, qui est normalisée puis confrontée à `users`.

   ENVOI RÉEL OBLIGATOIRE (étape 16) :
   Resend est désormais la SEULE voie d'envoi. Il n'existe plus de mode
   de repli qui journalise le code : le code OTP n'est écrit nulle part
   ailleurs que dans l'e-mail et, sous forme d'empreinte SHA-256, dans
   `reset_tokens`. Il n'apparaît dans aucun journal, en aucun
   environnement.
     • RESEND_API_KEY absente ou vide  → 503, aucune génération, aucun
       stockage, aucun appel réseau. Vérifié AVANT la recherche du
       compte, pour que la réponse soit identique quel que soit
       l'appelant (préserve la propriété anti-énumération ci-dessus).
     • Envoi refusé par Resend (statut non-2xx, réponse sans identifiant
       de message, ou erreur réseau) → 502, et l'OTP déjà stocké est
       invalidé (voir plus bas). Jamais de { ok: true } dans ce cas.
   Le corps des réponses d'erreur Resend n'est jamais journalisé (il
   peut contenir l'adresse du destinataire) — seul le statut HTTP l'est.
   La clé API n'est jamais journalisée.
═══════════════════════════════════════════════════════════ */

const RESEND_KEY = process.env.RESEND_API_KEY?.trim();
const FROM_EMAIL = process.env.RESET_FROM_EMAIL ?? "Drive-Path <noreply@drive-path.ca>";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const body = await req.json() as { email?: string };
    const email = (body.email ?? "").toLowerCase().trim();

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    /* ── L'envoi doit être possible — sinon on ne commence pas ─── */
    /* Placé avant la recherche du compte, et donc avant toute        */
    /* génération ou écriture : si l'e-mail ne peut pas partir, rien  */
    /* ne doit être créé. Cette position rend aussi la réponse        */
    /* identique pour toute adresse — un client ne peut pas déduire   */
    /* l'existence d'un compte d'une panne de configuration.          */
    /* La cause exacte n'est jamais exposée au client ; la clé API    */
    /* n'est ni lue ni journalisée ici.                               */

    if (!RESEND_KEY) {
      console.error(
        "[reset-code] RESEND_API_KEY absente ou vide — envoi impossible, aucun code généré.",
      );
      return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
    }

    /* ── Le compte doit exister — vérification serveur ─────────── */
    /* Placée avant le cooldown et avant toute génération : une       */
    /* adresse sans compte n'entraîne ni écriture dans reset_tokens, */
    /* ni envoi Resend. Même recherche que /api/auth/login, sur       */
    /* l'adresse normalisée (les adresses sont stockées en minuscules */
    /* par /api/auth/register).                                       */

    const existingUser = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existingUser.length === 0) {
      // Réponse volontairement identique à celle d'une demande valide.
      // Aucun code n'a été généré, rien n'a été stocké, aucun e-mail
      // n'est parti — et rien dans cette réponse ne le laisse voir.
      return NextResponse.json({ ok: true, sentAt: Date.now() });
    }

    // Vérifier le cooldown côté serveur
    const cooldownMs = await getCooldownRemainingMs(email);
    if (cooldownMs > 0) {
      return NextResponse.json(
        { ok: false, error: "cooldown", remainingMs: cooldownMs },
        { status: 429 },
      );
    }

    // Générer et stocker l'OTP côté serveur
    const code   = generateOTPCode();
    const sentAt = await storeOTP(email, code);

    // Envoyer le code par e-mail — Resend est la seule voie d'envoi
    const html    = buildEmailHtml(code);
    const subject = "Votre code de réinitialisation Drive-Path";

    /* ── Envoi réel via Resend HTTP API ────────────────────────── */
    /* L'e-mail n'est considéré comme accepté que si Resend répond   */
    /* un statut 2xx ET un identifiant de message. Un statut d'erreur */
    /* comme une panne réseau laissent `accepted` à false.           */

    let accepted = false;
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_KEY}`,
        },
        body: JSON.stringify({ from: FROM_EMAIL, to: [email], subject, html }),
      });

      if (res.ok) {
        const payload = await res.json().catch(() => null) as { id?: unknown } | null;
        accepted = typeof payload?.id === "string" && payload.id.length > 0;
        if (!accepted) {
          console.error("[reset-code] Resend a répondu 2xx sans identifiant de message.");
        }
      } else {
        // Statut seul : le corps peut contenir l'adresse du destinataire.
        console.error("[reset-code] Envoi Resend refusé — statut HTTP:", res.status);
      }
    } catch (sendErr) {
      console.error(
        "[reset-code] Appel Resend impossible:",
        sendErr instanceof Error ? sendErr.name : "erreur inconnue",
      );
    }

    /* ── Échec d'envoi : l'OTP stocké devient inutilisable ─────── */
    /* Il a été inséré avant l'appel réseau (seule façon d'éviter     */
    /* d'envoyer un code qui ne serait pas encore vérifiable). Comme  */
    /* personne ne l'a reçu, on le neutralise immédiatement avec      */
    /* markOTPUsed() — fonction déjà présente dans lib/otp-store.ts,  */
    /* qui pose `usedAt` sur la dernière ligne "otp" de cette adresse,*/
    /* soit précisément celle qui vient d'être créée. verifyOTPCode() */
    /* la rejettera alors ("used"). Aucun schéma modifié, aucune      */
    /* ligne supprimée, aucune trace de l'échec côté client.          */

    if (!accepted) {
      try {
        await markOTPUsed(email);
      } catch (invalidateErr) {
        console.error(
          "[reset-code] Invalidation de l'OTP non envoyé échouée:",
          invalidateErr,
        );
      }
      return NextResponse.json({ ok: false, error: "send_failed" }, { status: 502 });
    }

    // Retourner sentAt pour le cooldown côté client — JAMAIS le code
    return NextResponse.json({ ok: true, sentAt });
  } catch (err) {
    console.error("[reset-code] Unexpected error:", err);
    // Erreur interne : réponse générique, jamais un faux succès.
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
