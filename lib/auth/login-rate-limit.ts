/*
 * ═══════════════════════════════════════════════════════════
 *   Limitation des tentatives de connexion (H1) — Drive-Path
 *
 *   Compteurs persistants dans la table Neon `login_attempts`
 *   (lib/database/schema.ts) — partagés entre toutes les instances,
 *   jamais en mémoire du processus ni dans le navigateur.
 *
 *   Politique :
 *     • email : 5 tentatives non réussies / 15 min — toujours active,
 *       que le compte existe ou non.
 *     • IP    : 20 tentatives non réussies / 15 min — active UNIQUEMENT
 *       si AUTH_CLIENT_IP_SOURCE désigne une source fiable (voir
 *       getTrustedClientIp() et docs/security/auth-hardening.md).
 *
 *   Principe (réservation puis restitution) :
 *     1. Chaque tentative réserve d'abord une unité par un UPSERT
 *        atomique (INSERT … ON CONFLICT DO UPDATE … RETURNING). PostgreSQL
 *        verrouille la ligne : des requêtes simultanées obtiennent des
 *        valeurs de count distinctes et successives — jamais plus de
 *        `limit` tentatives vérifiées par fenêtre.
 *     2. Au-delà de la limite → refus, sans vérifier le mot de passe.
 *     3. Connexion réussie → l'unité réservée est rendue (count - 1),
 *        seulement si la fenêtre n'a pas changé entre-temps. Un succès
 *        n'est donc jamais compté comme un échec, et un compteur n'est
 *        jamais remis à zéro par un succès.
 *
 *   Aucune valeur en clair : key = "email:<sha256>" ou "ip:<sha256>".
 *
 *   ⚠️  SERVEUR UNIQUEMENT.
 * ═══════════════════════════════════════════════════════════
 */

import { createHash } from "crypto";
import { isIP } from "net";
import { and, eq, lt, sql } from "drizzle-orm";
import { db, schema } from "@/lib/database";

export const LOGIN_WINDOW_SECONDS = 15 * 60;
export const EMAIL_FAILURE_LIMIT  = 5;
export const IP_FAILURE_LIMIT     = 20;

/** Probabilité de purger les lignes expirées à chaque tentative. */
const PURGE_PROBABILITY = 0.01;

const WINDOW = sql.raw(`interval '${LOGIN_WINDOW_SECONDS} seconds'`);
const t = schema.loginAttempts;

/** Unité réservée pour une clé — à rendre en cas de succès. */
export type Reservation = { key: string; windowStart: Date };

export type ReserveResult =
  | { allowed: true; reservation: Reservation }
  | { allowed: false; retryAfterSeconds: number };

/* ── Clés ──────────────────────────────────────────────── */

function hashKey(kind: "email" | "ip", value: string): string {
  return `${kind}:${createHash("sha256").update(`${kind}:${value}`).digest("hex")}`;
}

/** Même normalisation que /api/auth/login (trim + minuscules). */
export function emailKey(email: string): string {
  return hashKey("email", email.trim().toLowerCase());
}

export function ipKey(ip: string): string {
  return hashKey("ip", ip);
}

/* ── Réservation / restitution ─────────────────────────── */

/**
 * Réserve une tentative pour `key` (UPSERT atomique). Une fenêtre
 * écoulée est remise à zéro dans la même instruction.
 */
export async function reserveAttempt(key: string, limit: number): Promise<ReserveResult> {
  const expired = sql`${t.windowStart} <= now() - ${WINDOW}`;
  // Tronqué à la milliseconde : window_start doit faire l'aller-retour
  // exact via un Date JS pour que releaseAttempt() le retrouve.
  const nowMs = sql`date_trunc('milliseconds', now())`;

  const rows = await db
    .insert(t)
    .values({ key, count: 1, windowStart: nowMs })
    .onConflictDoUpdate({
      target: t.key,
      set: {
        count:       sql`CASE WHEN ${expired} THEN 1 ELSE ${t.count} + 1 END`,
        windowStart: sql`CASE WHEN ${expired} THEN ${nowMs} ELSE ${t.windowStart} END`,
      },
    })
    .returning({
      count:       t.count,
      windowStart: t.windowStart,
      // Délai calculé par la base (même horloge que window_start).
      retryAfter:  sql<number>`ceil(extract(epoch from (${t.windowStart} + ${WINDOW} - now())))::int`,
    });

  const row = rows[0];
  if (row.count > limit) {
    // Borné à [1, fenêtre] : jamais négatif ni nul, jamais incohérent.
    const retryAfterSeconds = Math.min(Math.max(Number(row.retryAfter) || 1, 1), LOGIN_WINDOW_SECONDS);
    return { allowed: false, retryAfterSeconds };
  }
  return { allowed: true, reservation: { key, windowStart: row.windowStart } };
}

/**
 * Rend une unité réservée (connexion réussie). Sans effet si la fenêtre
 * a été remise à zéro entre-temps.
 */
export async function releaseAttempt(reservation: Reservation): Promise<void> {
  await db
    .update(t)
    .set({ count: sql`greatest(${t.count} - 1, 0)` })
    .where(and(eq(t.key, reservation.key), eq(t.windowStart, reservation.windowStart)));
}

/**
 * Purge occasionnelle des lignes dont la fenêtre est écoulée (elles sont
 * équivalentes à une absence de ligne). Appelée avec une probabilité de
 * PURGE_PROBABILITY ; un échec n'affecte jamais la connexion.
 */
export async function maybePurgeExpiredAttempts(): Promise<void> {
  if (Math.random() >= PURGE_PROBABILITY) return;
  try {
    await db.delete(t).where(lt(t.windowStart, sql`now() - ${WINDOW}`));
  } catch (err) {
    console.error("[login-rate-limit] Purge des tentatives expirées échouée:", err);
  }
}

/* ── IP du client (conditionnelle) ─────────────────────── */

/*
 * AUTH_CLIENT_IP_SOURCE — valeurs autorisées :
 *   (absente) | "" | "none" → limitation IP désactivée (défaut).
 *   "x-real-ip"             → en-tête X-Real-IP, UNIQUEMENT si la
 *                             plateforme le remplace systématiquement.
 *   "xff:N" (N = 1..10)     → N-ième adresse en partant de la DROITE de
 *                             X-Forwarded-For, N = nombre de proxys de
 *                             confiance qui ajoutent chacun une adresse.
 * Toute autre valeur → désactivée + erreur journalisée une fois.
 */

type IpSource = { kind: "none" } | { kind: "x-real-ip" } | { kind: "xff"; hops: number };

let warnedConfig = false;

function parseIpSource(raw: string | undefined): IpSource {
  const value = (raw ?? "").trim().toLowerCase();
  if (value === "" || value === "none") return { kind: "none" };
  if (value === "x-real-ip") return { kind: "x-real-ip" };
  const m = /^xff:(\d{1,2})$/.exec(value);
  if (m) {
    const hops = Number(m[1]);
    if (hops >= 1 && hops <= 10) return { kind: "xff", hops };
  }
  if (!warnedConfig) {
    warnedConfig = true;
    console.error(
      "[login-rate-limit] AUTH_CLIENT_IP_SOURCE invalide — limitation par IP désactivée.",
    );
  }
  return { kind: "none" };
}

/** Développe une IPv6 en 8 groupes hexadécimaux ; null si invalide. */
function expandIPv6(ip: string): string[] | null {
  const halves = ip.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 2 ? missing < 1 : missing !== 0) return null;
  return [...head, ...Array(missing).fill("0"), ...tail]
    .map((g) => g.padStart(4, "0").toLowerCase());
}

/**
 * Normalise une IP : IPv4 telle quelle, IPv4 mappée en IPv6 ramenée en
 * IPv4, IPv6 regroupée par préfixe /64 (un client dispose en général
 * d'un /64 entier). null si l'adresse est invalide.
 */
export function normalizeIp(raw: string): string | null {
  const ip = raw.trim();
  const version = isIP(ip);
  if (version === 4) return ip;
  if (version !== 6) return null;
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip);
  if (mapped && isIP(mapped[1]) === 4) return mapped[1];
  if (ip.includes(".")) return null; // autres formes IPv6 + IPv4 : non gérées
  const groups = expandIPv6(ip);
  return groups ? `${groups.slice(0, 4).join(":")}::/64` : null;
}

/**
 * IP du client selon AUTH_CLIENT_IP_SOURCE, ou null si la limitation par
 * IP est désactivée, ou si l'en-tête attendu est absent ou invalide.
 * Aucun en-tête n'est lu sans configuration explicite.
 */
export function getTrustedClientIp(headers: Headers): string | null {
  const source = parseIpSource(process.env.AUTH_CLIENT_IP_SOURCE);
  if (source.kind === "none") return null;

  if (source.kind === "x-real-ip") {
    const value = headers.get("x-real-ip");
    return value ? normalizeIp(value) : null;
  }

  const parts = (headers.get("x-forwarded-for") ?? "")
    .split(",").map((p) => p.trim()).filter(Boolean);
  const candidate = parts[parts.length - source.hops];
  return candidate ? normalizeIp(candidate) : null;
}
