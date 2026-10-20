import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth/session";
import type { ProfileData } from "@/lib/auth";

/* ═══════════════════════════════════════════════════════════
   CONTRÔLE D'ACCÈS COMMUN AUX TROIS HANDLERS (étape 17)

   Les trois routes appliquent la même règle, dans cet ordre :
     1. Pas de session valide          → 401 not_authenticated
     2. Session valide, rôle ≠ moniteur → 403 forbidden
     3. Sinon, accès limité à SON PROPRE profil (user.id de la session)

   Le rôle provient exclusivement de `users.role` dans Neon : getCurrentUser()
   (lib/auth/session.ts) le lit par jointure entre `sessions` et `users` à
   partir de l'empreinte du cookie HttpOnly. Il n'est donc jamais fourni par
   le navigateur, ni lu dans le corps de la requête, ni déductible d'un
   paramètre client — le modifier exigerait d'écrire dans la base.

   La page app/instructor/account/page.tsx effectuait déjà cette vérification
   de rôle avant tout rendu ; l'API, elle, ne la faisait pas alors qu'elle est
   directement atteignable. Les trois handlers sont désormais alignés sur elle.
═══════════════════════════════════════════════════════════ */

/** Seul rôle autorisé à lire et écrire un profil moniteur. */
const INSTRUCTOR_ROLE = "instructor";

/* ═══════════════════════════════════════════════════════════
   GET /api/instructor/profile

   Retourne le profil moniteur de l'utilisateur actuellement authentifié,
   lu depuis Neon (`instructor_profiles`), au format ProfileData
   (step1..step6) — même forme que celle déjà utilisée côté client par
   dp_account.profile, pour rester une source de lecture interchangeable.

   SÉCURITÉ :
   - user_id vient UNIQUEMENT de la session serveur (getCurrentUser()) —
     jamais d'un paramètre fourni par le client. Sans session valide : 401.
   - Colonnes sélectionnées explicitement — jamais password_hash, jamais
     de donnée de session, jamais id/user_id/created_at/updated_at (aucune
     information de `users` ou de `instructor_profiles` autre que le
     contenu du profil lui-même n'est renvoyée).
   - { ok: true, profile: null } si aucun profil Neon n'existe encore pour
     ce compte (le client bascule alors sur le fallback localStorage).
═══════════════════════════════════════════════════════════ */

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
    }
    // Rôle issu de Neon via la session — voir le bloc en tête de fichier.
    if (user.role !== INSTRUCTOR_ROLE) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const rows = await db
      .select({
        firstName:           schema.instructorProfiles.firstName,
        lastName:            schema.instructorProfiles.lastName,
        personalEmail:       schema.instructorProfiles.personalEmail,
        phone:               schema.instructorProfiles.phone,
        birthDate:           schema.instructorProfiles.birthDate,
        street:               schema.instructorProfiles.street,
        complement:          schema.instructorProfiles.complement,
        city:                schema.instructorProfiles.city,
        postalCode:          schema.instructorProfiles.postalCode,
        province:            schema.instructorProfiles.province,
        activityRadiusKm:    schema.instructorProfiles.activityRadiusKm,
        professionalStatus:  schema.instructorProfiles.professionalStatus,
        certificationNumber: schema.instructorProfiles.certificationNumber,
        yearsExperience:     schema.instructorProfiles.yearsExperience,
        specialties:         schema.instructorProfiles.specialties,
        bio:                 schema.instructorProfiles.bio,
        lessonTypes:         schema.instructorProfiles.lessonTypes,
        pricePerHour:        schema.instructorProfiles.pricePerHour,
        durations:           schema.instructorProfiles.durations,
        durationPrices:      schema.instructorProfiles.durationPrices,
        customizedPrices:    schema.instructorProfiles.customizedPrices,
        packages:            schema.instructorProfiles.packages,
        vehicleBrand:        schema.instructorProfiles.vehicleBrand,
        vehicleModel:        schema.instructorProfiles.vehicleModel,
        vehicleYear:         schema.instructorProfiles.vehicleYear,
        gearbox:             schema.instructorProfiles.gearbox,
        vehicleColor:        schema.instructorProfiles.vehicleColor,
        availableDays:       schema.instructorProfiles.availableDays,
        morningAvailable:    schema.instructorProfiles.morningAvailable,
        afternoonAvailable:  schema.instructorProfiles.afternoonAvailable,
        eveningAvailable:    schema.instructorProfiles.eveningAvailable,
      })
      .from(schema.instructorProfiles)
      .where(eq(schema.instructorProfiles.userId, user.id))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return NextResponse.json({ ok: true, profile: null });
    }

    /* ── Colonnes → step1..step6 (inverse de la correspondance POST) ── */

    const profile: ProfileData = {
      step1: {
        firstName: row.firstName,
        lastName:  row.lastName,
        email:     row.personalEmail,
        phone:     row.phone,
        birthDate: row.birthDate,
      },
      step2: {
        street:         row.street,
        complement:     row.complement ?? "",
        city:           row.city,
        postalCode:     row.postalCode,
        province:       row.province,
        activityRadius: String(row.activityRadiusKm),
      },
      step3: {
        status:               row.professionalStatus,
        certificationNumber:  row.certificationNumber,
        yearsExperience:      String(row.yearsExperience),
        specialties:          row.specialties,
        bio:                  row.bio,
      },
      step4: {
        lessonTypes:      row.lessonTypes,
        pricePerHour:     row.pricePerHour,
        durations:        row.durations,
        durationPrices:   row.durationPrices,
        customizedPrices: row.customizedPrices ?? [],
        packages:         row.packages ?? [],
      },
      step5: {
        brand:   row.vehicleBrand,
        model:   row.vehicleModel,
        year:    String(row.vehicleYear),
        gearbox: row.gearbox,
        color:   row.vehicleColor ?? "",
      },
      step6: {
        days:      row.availableDays,
        morning:   row.morningAvailable,
        afternoon: row.afternoonAvailable,
        evening:   row.eveningAvailable,
      },
    };

    return NextResponse.json({ ok: true, profile });

  } catch (err) {
    console.error("[instructor/profile][GET] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════
   POST /api/instructor/profile
   Body : ProfileData — { step1, step2, step3, step4, step5, step6 }
   (forme exacte de loadAll() dans app/instructor/register/_store.ts,
   déjà utilisée par finalizeAccount() dans lib/auth/index.ts)

   Enregistre le profil moniteur dans Neon (`instructor_profiles`),
   en parallèle de l'ancien dp_account.profile (localStorage) qui
   reste temporairement en place — voir app/instructor/register/step-7.

   SÉCURITÉ :
   - user_id vient UNIQUEMENT de la session serveur (getCurrentUser(),
     cookie HttpOnly dp_session → table Neon `sessions`). Le corps de la
     requête ne contient et ne peut fournir aucun identifiant utilisateur
     — impossible d'écrire le profil d'un autre compte.
   - Sans session valide, la requête est refusée (401) — aucune écriture.
   - Le mot de passe / son hash ne font jamais partie de ce payload et ne
     sont jamais écrits dans `instructor_profiles`.
   - Si un profil existe déjà pour cet utilisateur, il est mis à jour
     (UPSERT sur la contrainte UNIQUE instructor_profiles.user_id) —
     jamais de doublon.
   - En cas d'échec d'écriture Neon, aucun succès n'est simulé : réponse
     générique { ok: false, error: "server_error" }, détail loggé
     uniquement côté serveur, jamais de détail SQL exposé au client.

   CORRESPONDANCE step1..step6 → colonnes : voir lib/database/schema.ts
   (table instructor_profiles, établie à l'étape précédente).
═══════════════════════════════════════════════════════════ */

/** Convertit une chaîne numérique requise en entier ; null si vide/non numérique. */
function parseRequiredInt(value: string): number | null {
  if (!value || !value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Sous-ensemble numérique existant d'un profil Neon, utilisé comme repli. */
type ExistingNumericFields = {
  activityRadiusKm: number;
  yearsExperience: number;
  vehicleYear: number;
};

/**
 * Valide un ProfileData reçu et le convertit vers les colonnes
 * instructor_profiles (hors userId, ajouté séparément par chaque handler).
 * Partagée par POST et PUT pour ne pas dupliquer la correspondance
 * step1..step6 → colonnes.
 *
 * `existing` (optionnel) : valeurs numériques déjà en base pour cet
 * utilisateur. Si un champ numérique soumis (activityRadius,
 * yearsExperience, year) est vide ou invalide — typiquement une section
 * du profil non éditée, encore chargée depuis un ancien dp_account.profile
 * incomplet — on retombe sur la valeur Neon existante au lieu de rejeter
 * toute la requête. Sans `existing` (aucun profil Neon pour cet
 * utilisateur, ex. POST à l'inscription), ces champs restent strictement
 * obligatoires comme avant.
 */
function parseProfileBody(body: Partial<ProfileData>, existing?: ExistingNumericFields | null) {
  const { step1, step2, step3, step4, step5, step6 } = body;
  if (!step1 || !step2 || !step3 || !step4 || !step5 || !step6) return null;

  const activityRadiusKm = parseRequiredInt(step2.activityRadius) ?? existing?.activityRadiusKm ?? null;
  const yearsExperience  = parseRequiredInt(step3.yearsExperience)  ?? existing?.yearsExperience  ?? null;
  const vehicleYear      = parseRequiredInt(step5.year)             ?? existing?.vehicleYear      ?? null;
  if (activityRadiusKm === null || yearsExperience === null || vehicleYear === null) return null;

  return {
    // step1 — Informations personnelles
    firstName:     step1.firstName,
    lastName:      step1.lastName,
    personalEmail: step1.email,
    phone:         step1.phone,
    birthDate:     step1.birthDate,

    // step2 — Adresse et zone d'activité
    street:      step2.street,
    complement:  step2.complement || null,
    city:        step2.city,
    postalCode:  step2.postalCode,
    province:    step2.province,
    activityRadiusKm,

    // step3 — Profil professionnel
    professionalStatus:  step3.status,
    certificationNumber: step3.certificationNumber,
    yearsExperience,
    specialties: step3.specialties,
    bio:         step3.bio,

    // step4 — Services et tarifs
    lessonTypes:      step4.lessonTypes,
    pricePerHour:      step4.pricePerHour, // colonne numeric — chaîne conservée telle quelle, aucune perte de précision
    durations:         step4.durations,
    durationPrices:    step4.durationPrices,
    customizedPrices:  step4.customizedPrices?.length ? step4.customizedPrices : null,
    packages:          step4.packages?.length ? step4.packages : null,

    // step5 — Véhicule d'apprentissage
    vehicleBrand: step5.brand,
    vehicleModel: step5.model,
    vehicleYear,
    gearbox:      step5.gearbox,
    vehicleColor: step5.color || null,

    // step6 — Disponibilités
    availableDays:      step6.days,
    morningAvailable:   step6.morning,
    afternoonAvailable: step6.afternoon,
    eveningAvailable:   step6.evening,
  };
}

export async function POST(req: NextRequest) {
  try {
    /* ── Utilisateur authentifié — jamais un id fourni par le client ── */

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
    }
    // Rôle issu de Neon via la session — voir le bloc en tête de fichier.
    if (user.role !== INSTRUCTOR_ROLE) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const body = await req.json() as Partial<ProfileData>;
    const parsed = parseProfileBody(body);
    if (!parsed) {
      return NextResponse.json({ ok: false, error: "invalid_profile" }, { status: 400 });
    }

    const row = { userId: user.id, ...parsed };

    /* ── UPSERT — insère, ou met à jour si un profil existe déjà ──── */

    await db
      .insert(schema.instructorProfiles)
      .values(row)
      .onConflictDoUpdate({
        target: schema.instructorProfiles.userId,
        set: { ...row, updatedAt: new Date() },
      });

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[instructor/profile][POST] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════
   PUT /api/instructor/profile
   Body : ProfileData — { step1, step2, step3, step4, step5, step6 }

   Met à jour le profil moniteur de l'utilisateur authentifié (édition
   depuis le tableau de bord — app/instructor/account/_client.tsx,
   DashboardView.handleSave()).

   UPSERT : si une ligne existe déjà pour cet utilisateur, elle est mise
   à jour ; sinon elle est créée. Correction du 404 profile_not_found
   qui bloquait toute modification pour les comptes possédant un compte
   dans `users` mais aucune ligne encore synchronisée dans
   `instructor_profiles` (ex. profil finalisé avant l'écriture Neon à
   l'inscription, ou POST initial jamais abouti).

   ÉDITION D'UNE SEULE SECTION : le client envoie le profil complet
   (section modifiée fusionnée aux autres, inchangées). Si une section
   non éditée provient encore d'un ancien dp_account.profile incomplet,
   son champ numérique (activityRadius/yearsExperience/year) peut être
   vide/invalide — cela ne doit pas empêcher d'enregistrer la section
   réellement modifiée. Le profil Neon existant est donc lu d'abord et
   sert de repli pour ces trois champs dans parseProfileBody() — une
   donnée Neon valide n'est jamais écrasée par une valeur vide reçue.

   SÉCURITÉ : identique à POST — user_id vient uniquement de
   getCurrentUser() ; jamais de user_id accepté depuis le client ;
   colonnes explicites ; jamais de mot de passe ; jamais de détail
   SQL/serveur exposé en cas d'échec.
═══════════════════════════════════════════════════════════ */

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
    }
    // Rôle issu de Neon via la session — voir le bloc en tête de fichier.
    if (user.role !== INSTRUCTOR_ROLE) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const body = await req.json() as Partial<ProfileData>;

    /* ── Profil Neon existant — repli pour les champs numériques ───── */
    /* non réellement modifiés (voir parseProfileBody). Pas de repli    */
    /* possible pour un utilisateur sans profil : validation stricte.  */

    const existingRows = await db
      .select({
        activityRadiusKm: schema.instructorProfiles.activityRadiusKm,
        yearsExperience:  schema.instructorProfiles.yearsExperience,
        vehicleYear:      schema.instructorProfiles.vehicleYear,
      })
      .from(schema.instructorProfiles)
      .where(eq(schema.instructorProfiles.userId, user.id))
      .limit(1);
    const existing = existingRows[0] ?? null;

    const parsed = parseProfileBody(body, existing);
    if (!parsed) {
      return NextResponse.json({ ok: false, error: "invalid_profile" }, { status: 400 });
    }

    /* ── UPSERT — met à jour si le profil existe, le crée sinon ────── */

    const row = { userId: user.id, ...parsed };

    await db
      .insert(schema.instructorProfiles)
      .values(row)
      .onConflictDoUpdate({
        target: schema.instructorProfiles.userId,
        set: { ...parsed, updatedAt: new Date() },
      });

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[instructor/profile][PUT] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
