/*
 * ═══════════════════════════════════════════════════════════
 *   Connexion Drizzle — Neon PostgreSQL
 *
 *   Utilise le driver HTTP @neondatabase/serverless.
 *   Compatible avec le runtime Node.js et Edge (Vercel, Cloudflare).
 *
 *   ⚠️  SERVEUR UNIQUEMENT — Ne jamais importer depuis un composant client.
 *   ⚠️  Nécessite DATABASE_URL dans .env.local.
 * ═══════════════════════════════════════════════════════════
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "\n[Drive-Path DB] DATABASE_URL est manquant.\n" +
    "Ajoutez la variable dans .env.local :\n" +
    "  DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require\n" +
    "Obtenez la chaîne de connexion depuis : https://console.neon.tech\n",
  );
}

const sql = neon(databaseUrl);

/**
 * Instance Drizzle connectée à Neon.
 * Importer depuis les routes API et les actions serveur uniquement.
 *
 * @example
 * import { db } from "@/lib/database";
 * const allUsers = await db.select().from(schema.users);
 */
export const db = drizzle(sql, { schema });

// Ré-exporter le schéma pour éviter les imports multiples
export { schema };
