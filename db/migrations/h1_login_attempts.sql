-- ═══════════════════════════════════════════════════════════
--   Migration H1 — table login_attempts
--   Statut : À APPLIQUER MANUELLEMENT (console SQL Neon), une fois.
--
--   Crée la table des compteurs de limitation des tentatives de
--   connexion (lib/auth/login-rate-limit.ts). Additive uniquement :
--   aucune table existante n'est modifiée, aucune donnée supprimée.
--   Idempotente (IF NOT EXISTS) : une seconde exécution est sans effet.
--
--   Correspond exactement à `loginAttempts` dans lib/database/schema.ts
--   (vérifié avec `drizzle-kit export`, hors ligne).
--
--   ⚠️  Tant qu'elle n'est pas appliquée, POST /api/auth/login répond
--   500 server_error (la limitation ne se désactive jamais d'elle-même).
-- ═══════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS "login_attempts" (
	"key" varchar(80) PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "login_attempts_window_start_idx"
	ON "login_attempts" USING btree ("window_start");

COMMIT;

-- Vérification après exécution :
--   SELECT column_name, data_type, is_nullable, column_default
--   FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'login_attempts'
--   ORDER BY ordinal_position;
