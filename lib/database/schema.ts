/*
 * ═══════════════════════════════════════════════════════════
 *   Schéma Drizzle — Drive-Path
 *
 *   Tables définies ici :
 *     • users        — Comptes utilisateurs (moniteurs, apprenants, admins)
 *     • reset_tokens — Codes OTP et tokens de réinitialisation de mot de passe
 *     • sessions     — Sessions serveur (préparation cookie HttpOnly)
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

/* ── Types inférés ─────────────────────────────────────── */

export type User       = typeof users.$inferSelect;
export type NewUser    = typeof users.$inferInsert;
export type ResetToken = typeof resetTokens.$inferSelect;
export type NewResetToken = typeof resetTokens.$inferInsert;
export type Session    = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
