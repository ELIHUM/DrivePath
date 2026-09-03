import { NextResponse } from "next/server";
import { invalidateSession } from "@/lib/auth/session";

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/logout

   Invalide la session serveur courante :
   - lit le cookie HttpOnly dp_session (jamais transmis dans le body)
   - supprime la ligne correspondante dans la table Neon `sessions`
   - efface le cookie dp_session

   Voir invalidateSession() dans lib/auth/session.ts. Sans argument, elle
   invalide la session identifiée par le cookie de la requête courante.

   SÉCURITÉ :
   - Aucun token de session n'est jamais lu depuis le body ni renvoyé
     dans la réponse.
   - Idempotente : appelée sans cookie valide, elle ne fait rien côté
     Neon mais efface quand même le cookie et répond ok.
═══════════════════════════════════════════════════════════ */

export async function POST() {
  try {
    await invalidateSession();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[logout] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
