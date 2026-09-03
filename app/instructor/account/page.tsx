import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import InstructorAccountClient from "./_client";

/* ═══════════════════════════════════════════════════════════
   /instructor/account — Server Component

   Cette route sert deux usages :
     1. Point d'entrée public de création de compte moniteur
        (visiteur non connecté — voir _client.tsx, inchangé).
     2. Dashboard moniteur (utilisateur connecté avec role="instructor").

   Vérification serveur ajoutée ici :
   - getCurrentUser() lit la session Neon via le cookie HttpOnly
     dp_session — jamais via sessionStorage (non fiable côté serveur).
   - Un utilisateur connecté dont le rôle n'est PAS "instructor" est
     redirigé vers "/" avant tout rendu du dashboard.
   - Un visiteur non connecté n'est PAS redirigé ici : le composant
     client gère déjà ce cas en affichant le formulaire de création
     de compte (comportement existant, préservé à l'identique).

   currentUser (PublicUser | null) est transmis en prop à _client.tsx :
   c'est désormais lui — pas sessionStorage — qui détermine si le
   dashboard doit s'afficher. sessionStorage reste utilisé en interne
   par _client.tsx pour d'autres usages (édition de profil), inchangé.
═══════════════════════════════════════════════════════════ */

export default async function InstructorAccountPage() {
  const user = await getCurrentUser();

  // Connecté mais pas moniteur → pas sa place ici.
  if (user && user.role !== "instructor") {
    redirect("/");
  }

  return <InstructorAccountClient currentUser={user} />;
}
