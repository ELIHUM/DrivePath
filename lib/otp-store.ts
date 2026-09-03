/*
 * ═══════════════════════════════════════════════════════════
 *   OTP Store — Stockage serveur temporaire (en mémoire)
 *
 *   ⚠️  TEMPORAIRE — PROTOTYPE UNIQUEMENT
 *   Ce module utilise des Maps en mémoire du processus Node.js.
 *   Limitations :
 *     - Les données sont perdues au redémarrage du serveur
 *     - Non partagé entre instances serverless multiples
 *     - Ne convient pas à la production multi-instance
 *   À remplacer par une table `reset_tokens` en base de données
 *   lors de l'étape d'intégration DB (étape 4 du plan de migration).
 *
 *   ⚠️  SERVEUR UNIQUEMENT — Ne jamais importer depuis un composant client.
 * ═══════════════════════════════════════════════════════════
 */

import { randomBytes } from "crypto";

export const OTP_TTL_MS         = 10 * 60 * 1_000;  // 10 minutes
export const RESET_TOKEN_TTL_MS = 15 * 60 * 1_000;  // 15 min pour changer le mot de passe
export const OTP_COOLDOWN_MS    = 60 * 1_000;        // 60 s entre deux envois

/* ── Types ─────────────────────────────────────────────── */

export interface OTPEntry {
  code: string;
  expiresAt: number;
  used: boolean;
  sentAt: number;
}

export interface ResetTokenEntry {
  email: string;
  expiresAt: number;
  used: boolean;
}

export type VerifyOTPResult = "valid" | "invalid" | "expired" | "used";

/* ── Stores (globalThis pour survivre au hot-reload en dev) */

const g = globalThis as typeof globalThis & {
  __dpOtpStore?: Map<string, OTPEntry>;
  __dpResetTokenStore?: Map<string, ResetTokenEntry>;
};
if (!g.__dpOtpStore)        g.__dpOtpStore        = new Map();
if (!g.__dpResetTokenStore) g.__dpResetTokenStore = new Map();

const otpStore: Map<string, OTPEntry>               = g.__dpOtpStore;
const resetTokenStore: Map<string, ResetTokenEntry>  = g.__dpResetTokenStore;

/* ── Nettoyage des entrées expirées ────────────────────── */

function cleanup(): void {
  const now = Date.now();
  for (const [k, v] of otpStore)        if (v.expiresAt < now) otpStore.delete(k);
  for (const [k, v] of resetTokenStore) if (v.expiresAt < now) resetTokenStore.delete(k);
}

/* ── OTP ───────────────────────────────────────────────── */

/** Génère un code OTP à 6 chiffres cryptographiquement aléatoire. */
export function generateOTPCode(): string {
  const num = randomBytes(4).readUInt32BE(0) % 1_000_000;
  return String(num).padStart(6, "0");
}

/**
 * Stocke un OTP pour l'adresse email donnée.
 * Retourne le timestamp d'envoi (sentAt) pour le cooldown côté client.
 */
export function storeOTP(email: string, code: string): number {
  cleanup();
  const sentAt = Date.now();
  otpStore.set(email.toLowerCase().trim(), {
    code,
    expiresAt: sentAt + OTP_TTL_MS,
    used: false,
    sentAt,
  });
  return sentAt;
}

/**
 * Retourne le délai restant avant de pouvoir renvoyer (en ms).
 * Retourne 0 si le cooldown est écoulé ou s'il n'y a pas d'entrée.
 */
export function getCooldownRemainingMs(email: string): number {
  const entry = otpStore.get(email.toLowerCase().trim());
  if (!entry) return 0;
  const remaining = OTP_COOLDOWN_MS - (Date.now() - entry.sentAt);
  return remaining > 0 ? remaining : 0;
}

/** Vérifie un code OTP sans le consommer. */
export function verifyOTPCode(email: string, code: string): VerifyOTPResult {
  const entry = otpStore.get(email.toLowerCase().trim());
  if (!entry) return "invalid";
  if (entry.used) return "used";
  if (Date.now() > entry.expiresAt) return "expired";
  if (entry.code !== code.trim()) return "invalid";
  return "valid";
}

/** Marque un OTP comme utilisé (ne peut plus être vérifié). */
export function markOTPUsed(email: string): void {
  const entry = otpStore.get(email.toLowerCase().trim());
  if (entry) entry.used = true;
}

/* ── Reset Token ───────────────────────────────────────── */
/*  Émis par le serveur après vérification OTP réussie.    */
/*  Prouve que l'OTP a été validé sans exposer le code.   */

/** Génère un token opaque de 64 caractères hex. */
export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

/** Stocke un reset token associé à un email. */
export function storeResetToken(token: string, email: string): void {
  resetTokenStore.set(token, {
    email: email.toLowerCase().trim(),
    expiresAt: Date.now() + RESET_TOKEN_TTL_MS,
    used: false,
  });
}

/**
 * Vérifie et consomme un reset token (usage unique).
 * Retourne l'email associé si le token est valide.
 */
export function verifyAndConsumeResetToken(
  token: string,
): { ok: true; email: string } | { ok: false } {
  const entry = resetTokenStore.get(token);
  if (!entry || entry.used || Date.now() > entry.expiresAt) return { ok: false };
  entry.used = true;
  return { ok: true, email: entry.email };
}
