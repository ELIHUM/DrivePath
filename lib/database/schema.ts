/*
 * ═══════════════════════════════════════════════════════════
 *   Schéma Drizzle — Drive-Path
 *
 *   Tables définies ici :
 *     • users                — Comptes utilisateurs (moniteurs, apprenants, admins)
 *     • reset_tokens         — Codes OTP et tokens de réinitialisation de mot de passe
 *     • sessions             — Sessions serveur (préparation cookie HttpOnly)
 *     • instructor_profiles  — Profil moniteur complet (remplace progressivement
 *                              dp_account.profile en localStorage)
 *
 *   ⚠️  SERVEUR UNIQUEMENT — Ne jamais importer depuis un composant client.
 * ═══════════════════════════════════════════════════════════
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  integer,
  numeric,
  jsonb,
  boolean,
  date,
} from "drizzle-orm/pg-core";

/* ══════════════════════════════════════════════════════════
   TABLE : users
   Comptes de tous les utilisateurs de la plateforme.

   Notes d'architecture :
   - passwordHash : varchar(255) pour accommoder bcrypt (60 cars),
     Argon2id (~95+ cars) ou SHA-256 hex (64 cars — prototype actuel).
   - role : extensible — prévu pour "learner" | "instructor" | "admin".
   - updatedAt : mis à jour manuellement à chaque modification du compte
     (Neon/PostgreSQL ne gère pas l'auto-update côté DB sans trigger).
══════════════════════════════════════════════════════════ */

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    email: varchar("email", { length: 255 }).notNull().unique(),

    /** Hash du mot de passe. Taille suffisante pour bcrypt, Argon2, SHA-256. */
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),

    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName:  varchar("last_name",  { length: 100 }).notNull(),

    /**
     * Rôle de l'utilisateur.
     * Valeurs attendues : "instructor" | "learner" | "admin"
     * Défaut : "instructor" (flux d'inscription actuel).
     */
    role: varchar("role", { length: 20 }).notNull().default("instructor"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("users_email_idx").on(table.email),
  ],
);

/* ══════════════════════════════════════════════════════════
   TABLE : reset_tokens
   Codes OTP et tokens de réinitialisation de mot de passe.

   Remplace progressivement lib/otp-store.ts (Maps en mémoire).

   Deux types de tokens :
     • "otp"   — Code à 6 chiffres envoyé par email. Hash SHA-256 stocké.
     • "reset" — Token opaque (64 hex) émis après OTP validé. Hash SHA-256.

   Notes de sécurité :
   - tokenHash : jamais le token/code brut — toujours un hash SHA-256.
   - usedAt    : null = pas encore utilisé, timestamp = consommé.
   - Une rangée utilisée ou expirée ne peut pas être réutilisée.
   - email est la clé de lookup temporaire (avant migration userId).

   ⚠️  TODO (étape 4 migration) :
   - Ajouter userId (FK vers users.id) une fois users peuplée.
   - Supprimer la colonne email redondante à ce moment-là.
══════════════════════════════════════════════════════════ */

export const resetTokens = pgTable(
  "reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    /** Email de référence (temporaire — sera remplacé par userId). */
    email: varchar("email", { length: 255 }).notNull(),

    /**
     * Hash SHA-256 du token ou code OTP brut.
     * Permet de vérifier sans stocker la valeur sensible.
     */
    tokenHash: varchar("token_hash", { length: 255 }).notNull(),

    /**
     * Type de token :
     *   "otp"   — Code à 6 chiffres (TTL 10 min)
     *   "reset" — Token post-OTP autorisant le changement de mdp (TTL 15 min)
     */
    type: varchar("type", { length: 20 }).notNull(),

    /** Date d'expiration du token. Passée = invalide. */
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

    /** Date de consommation. null = pas encore utilisé (usage unique). */
    usedAt: timestamp("used_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("reset_tokens_email_idx").on(table.email),
    index("reset_tokens_type_idx").on(table.type),
  ],
);

/* ══════════════════════════════════════════════════════════
   TABLE : sessions
   Sessions serveur — préparation du remplacement de sessionStorage
   par un cookie HttpOnly (pas encore branché à cette étape).

   Architecture cible :
     Navigateur → cookie HttpOnly (token opaque)
       → serveur hash le token
       → recherche tokenHash dans `sessions`
       → récupération de userId
       → récupération de l'utilisateur dans `users`

   Notes de sécurité :
   - tokenHash : jamais le token brut — toujours un hash SHA-256
     (même logique que reset_tokens.tokenHash).
   - userId    : FK vers users.id — une session appartient à un seul user.
   - expiresAt : passée = session invalide (à vérifier côté application ;
     PostgreSQL ne purge pas automatiquement les lignes expirées ici).
   - updatedAt : mis à jour manuellement (ex. lors d'un renouvellement de
     session), comme pour users.updatedAt — pas de trigger DB.

   ⚠️  Structure créée par anticipation — aucune route n'écrit/lit encore
   cette table à cette étape (le login continue d'utiliser sessionStorage).
══════════════════════════════════════════════════════════ */

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    /** FK vers users.id — propriétaire de la session. */
    userId: uuid("user_id").notNull().references(() => users.id),

    /**
     * Hash SHA-256 du token de session opaque envoyé au navigateur
     * (futur cookie HttpOnly). Jamais le token brut.
     */
    tokenHash: varchar("token_hash", { length: 255 }).notNull().unique(),

    /** Date d'expiration de la session. Passée = invalide. */
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
  ],
);

/* ══════════════════════════════════════════════════════════
   TABLE : instructor_profiles
   Profil moniteur complet — destination cible de dp_account.profile
   (localStorage), rempli aujourd'hui par le formulaire multi-étapes
   app/instructor/register/ (step1 à step6).

   Relation : instructor_profiles.user_id → users.id (1 profil par
   utilisateur — contrainte d'unicité sur user_id).

   ⚠️  Étape de CRÉATION DE SCHÉMA UNIQUEMENT : aucune route ne lit ni
   n'écrit encore cette table. Le formulaire d'inscription continue
   d'écrire dans dp_account.profile (localStorage) pour l'instant —
   aucune donnée existante n'a été migrée ici.

   Notes d'architecture :
   - Colonnes regroupées et commentées par étape d'origine (step1..step6)
     du formulaire — voir la correspondance exacte dans la doc de migration.
   - durationPrices (step4) : dictionnaire { durée → tarif } dont les clés
     dépendent des durées sélectionnées par le moniteur — forme variable,
     stocké en JSONB pour ne perdre aucune donnée si le catalogue de
     durées évolue, plutôt qu'en colonnes fixes par durée.
   - Listes homogènes de chaînes (spécialités, jours, types de leçon,
     durées, forfaits) : tableaux Postgres natifs (text[]), pas JSONB —
     leur forme (liste de chaînes) est fixe, contrairement à durationPrices.
   - pricePerHour : numeric(10,2), pas integer — le formulaire accepte des
     tarifs décimaux (ex. 65,50 $), un entier perdrait cette précision.
   - Champs optionnels dans le formulaire (complement, color, packages,
     customizedPrices) : nullable. Le reste suit les règles de validation
     actuelles de chaque étape (obligatoire côté formulaire → NOT NULL).
══════════════════════════════════════════════════════════ */

export const instructorProfiles = pgTable("instructor_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),

  /** FK vers users.id — unique : un seul profil par utilisateur. */
  userId: uuid("user_id").notNull().unique().references(() => users.id),

  /* ── step1 — Informations personnelles ───────────────── */
  firstName:     varchar("first_name", { length: 100 }).notNull(),
  lastName:      varchar("last_name",  { length: 100 }).notNull(),
  personalEmail: varchar("personal_email", { length: 255 }).notNull(),
  phone:         varchar("phone", { length: 30 }).notNull(),
  birthDate:     date("birth_date").notNull(),

  /* ── step2 — Adresse et zone d'activité ──────────────── */
  street:           varchar("street", { length: 255 }).notNull(),
  complement:       varchar("complement", { length: 255 }),
  city:             varchar("city", { length: 100 }).notNull(),
  postalCode:       varchar("postal_code", { length: 10 }).notNull(),
  province:         varchar("province", { length: 50 }).notNull(),
  /** Rayon d'activité en km (options du formulaire : 5 / 10 / 20 / 50). */
  activityRadiusKm: integer("activity_radius_km").notNull(),

  /* ── step3 — Profil professionnel ────────────────────── */
  professionalStatus:  varchar("professional_status", { length: 50 }).notNull(),
  certificationNumber: varchar("certification_number", { length: 100 }).notNull(),
  yearsExperience:     integer("years_experience").notNull(),
  specialties:         text("specialties").array().notNull(),
  bio:                 text("bio").notNull(),

  /* ── step4 — Services et tarifs ──────────────────────── */
  lessonTypes:  text("lesson_types").array().notNull(),
  pricePerHour: numeric("price_per_hour", { precision: 10, scale: 2 }).notNull(),
  durations:    text("durations").array().notNull(),
  /** Dictionnaire { id de durée → tarif } — ex. { "60 min": "65" }. */
  durationPrices:   jsonb("duration_prices").$type<Record<string, string>>().notNull(),
  /** IDs de durée dont le tarif a été modifié manuellement (vs suggéré). */
  customizedPrices: text("customized_prices").array(),
  packages:         text("packages").array(),

  /* ── step5 — Véhicule d'apprentissage ────────────────── */
  vehicleBrand: varchar("vehicle_brand", { length: 100 }).notNull(),
  vehicleModel: varchar("vehicle_model", { length: 100 }).notNull(),
  vehicleYear:  integer("vehicle_year").notNull(),
  /** "manual" | "automatic" */
  gearbox:      varchar("gearbox", { length: 20 }).notNull(),
  vehicleColor: varchar("vehicle_color", { length: 50 }),

  /* ── step6 — Disponibilités ───────────────────────────── */
  /** Codes jours 3 lettres : "lun".."dim". */
  availableDays:      text("available_days").array().notNull(),
  morningAvailable:   boolean("morning_available").notNull().default(false),
  afternoonAvailable: boolean("afternoon_available").notNull().default(false),
  eveningAvailable:   boolean("evening_available").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ── Types inférés ─────────────────────────────────────── */

export type User       = typeof users.$inferSelect;
export type NewUser    = typeof users.$inferInsert;
export type ResetToken = typeof resetTokens.$inferSelect;
export type NewResetToken = typeof resetTokens.$inferInsert;
export type Session    = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type InstructorProfile    = typeof instructorProfiles.$inferSelect;
export type NewInstructorProfile = typeof instructorProfiles.$inferInsert;
