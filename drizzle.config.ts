import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// Charge .env.local (et .env) comme le fait Next.js lui-même
loadEnvConfig(process.cwd());

/*
 * Configuration Drizzle Kit — Drive-Path
 *
 * Commandes disponibles (après ajout dans package.json) :
 *   npm run db:generate  — Génère les fichiers de migration SQL dans ./drizzle/
 *   npm run db:migrate   — Applique les migrations sur la base de données
 *   npm run db:push      — Push direct du schéma sans fichier de migration (dev uniquement)
 *   npm run db:studio    — Interface visuelle Drizzle Studio (explorateur DB)
 *
 * Prérequis :
 *   DATABASE_URL doit être défini dans .env.local
 */

export default defineConfig({
  schema:  "./lib/database/schema.ts",
  out:     "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
