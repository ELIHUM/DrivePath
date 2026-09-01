/* ═══════════════════════════════════════════════════════════
   AUTHENTIFICATION — Prototype local (sans backend)

   ⚠️  AVERTISSEMENT PROTOTYPE ⚠️
   Les comptes sont stockés dans localStorage du navigateur.
   Les mots de passe sont hashés (SHA-256) — jamais en clair.
   Ne pas utiliser en production sans backend sécurisé.
═══════════════════════════════════════════════════════════ */

import type {
  Step1Data, Step2Data, Step3Data,
  Step4Data, Step5Data, Step6Data,
} from "@/app/instructor/register/_store";

/* ── Types publics ─────────────────────────────────────── */

export type ProfileData = {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
  step5: Step5Data;
  step6: Step6Data;
};

export type StoredAccount = {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  profile?: ProfileData;
};

export type AuthSession = {
  email: string;
  firstName: string;
  lastName: string;
};

export type LoginResult =
  | { ok: true; session: AuthSession }
  | { ok: false };

/* ── Clés de stockage ──────────────────────────────────── */

const ACCOUNT_KEY = "dp_account";
const SESSION_KEY = "dp_session";
const PHOTO_KEY   = "dp_profile_photo";

/* ── Hash SHA-256 via Web Crypto API ───────────────────── */

/** Hash un mot de passe avec SHA-256.
 *  Prototype : hash côté client sans sel serveur.
 *  Jamais de stockage en clair. */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`dp2024:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ── Compte ────────────────────────────────────────────── */

export function getStoredAccount(): StoredAccount | null {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    return raw ? (JSON.parse(raw) as StoredAccount) : null;
  } catch {
    return null;
  }
}

function saveAccount(account: StoredAccount): void {
  try {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  } catch {}
}

/** Étape 3A — crée un compte provisoire (profil ajouté à l'étape 3G). */
export async function createDraftAccount(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
): Promise<void> {
  const passwordHash = await hashPassword(password);
  saveAccount({
    email: email.toLowerCase().trim(),
    passwordHash,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    createdAt: new Date().toISOString(),
  });
}

/** Étape 3G — associe le profil complet au compte. */
export function finalizeAccount(profile: ProfileData): void {
  const account = getStoredAccount();
  if (!account) return;
  saveAccount({ ...account, profile });
}

/** Restaure les données du profil dans sessionStorage pour permettre l'édition. */
export function restoreProfileToSession(
  profile: ProfileData,
  saveStepFn: (n: number, data: unknown) => void,
): void {
  saveStepFn(1, profile.step1);
  saveStepFn(2, profile.step2);
  saveStepFn(3, profile.step3);
  saveStepFn(4, profile.step4);
  saveStepFn(5, profile.step5);
  saveStepFn(6, profile.step6);
}

/* ── Session ───────────────────────────────────────────── */

export function getSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

function saveSession(session: AuthSession): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {}
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}

export function isLoggedIn(): boolean {
  return getSession() !== null;
}

/* ── Connexion / Déconnexion ───────────────────────────── */

export async function tryLogin(
  email: string,
  password: string,
): Promise<LoginResult> {
  const account = getStoredAccount();
  if (!account || account.email !== email.toLowerCase().trim()) {
    return { ok: false };
  }
  const hash = await hashPassword(password);
  if (account.passwordHash !== hash) return { ok: false };

  const session: AuthSession = {
    email: account.email,
    firstName: account.firstName,
    lastName: account.lastName,
  };
  saveSession(session);
  return { ok: true, session };
}

export function logout(): void {
  clearSession();
}

/** Met à jour le profil complet dans localStorage et synchronise la session. */
export function updateProfileAndSession(profile: ProfileData): void {
  const account = getStoredAccount();
  if (!account) return;
  // Sync account-level fields from step1 in case name/email changed
  saveAccount({
    ...account,
    profile,
    firstName: profile.step1.firstName.trim() || account.firstName,
    lastName:  profile.step1.lastName.trim()  || account.lastName,
    email:     profile.step1.email.trim()     || account.email,
  });
  // Sync session so header reflects changes immediately
  const s = getSession();
  if (s) {
    saveSession({
      email:     profile.step1.email.trim()     || s.email,
      firstName: profile.step1.firstName.trim() || s.firstName,
      lastName:  profile.step1.lastName.trim()  || s.lastName,
    });
  }
}

/* ── Photo de profil ───────────────────────────────────── */

/** Stocke une Data URL (base64) dans localStorage. */
export function saveProfilePhoto(dataUrl: string): void {
  try { localStorage.setItem(PHOTO_KEY, dataUrl); } catch {}
}

/** Lit la Data URL depuis localStorage ; null si absente. */
export function getProfilePhoto(): string | null {
  try { return localStorage.getItem(PHOTO_KEY); } catch { return null; }
}

/** Supprime la photo de profil stockée. */
export function clearProfilePhoto(): void {
  try { localStorage.removeItem(PHOTO_KEY); } catch {}
}

/* ── Réinitialisation de mot de passe ──────────────────── */

const RESET_KEY      = "dp_reset_pending";
const FLOW_EMAIL_KEY = "dp_reset_email";
const FLOW_DONE_KEY  = "dp_reset_verified";
const RESET_TTL_MS   = 10 * 60 * 1_000; // 10 minutes
export const RESET_COOLDOWN_S = 60;      // secondes entre deux envois

export interface ResetToken {
  email: string;
  code: string;
  expiresAt: number;
  used: boolean;
  sentAt: number;
}

export type VerifyResult = "valid" | "invalid" | "expired" | "used";

/** Génère un code aléatoire à 6 chiffres via Web Crypto. */
export function generateResetCode(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(arr[0] % 1_000_000).padStart(6, "0");
}

export function saveResetToken(email: string, code: string): void {
  const token: ResetToken = {
    email: email.toLowerCase().trim(),
    code,
    expiresAt: Date.now() + RESET_TTL_MS,
    used: false,
    sentAt: Date.now(),
  };
  try { localStorage.setItem(RESET_KEY, JSON.stringify(token)); } catch {}
}

export function getResetToken(): ResetToken | null {
  try {
    const raw = localStorage.getItem(RESET_KEY);
    return raw ? (JSON.parse(raw) as ResetToken) : null;
  } catch { return null; }
}

export function clearResetToken(): void {
  try { localStorage.removeItem(RESET_KEY); } catch {}
}

/** Vérifie le code saisi par l'utilisateur. */
export function verifyResetCode(email: string, code: string): VerifyResult {
  const token = getResetToken();
  if (!token) return "invalid";
  if (token.email !== email.toLowerCase().trim()) return "invalid";
  if (token.used) return "used";
  if (Date.now() > token.expiresAt) return "expired";
  if (token.code !== code.trim()) return "invalid";
  return "valid";
}

/* ── Flow sessionStorage ───────────────────────────────── */

export function setFlowEmail(email: string): void {
  try { sessionStorage.setItem(FLOW_EMAIL_KEY, email.toLowerCase().trim()); } catch {}
}
export function getFlowEmail(): string | null {
  try { return sessionStorage.getItem(FLOW_EMAIL_KEY); } catch { return null; }
}
export function setFlowVerified(): void {
  try { sessionStorage.setItem(FLOW_DONE_KEY, "1"); } catch {}
}
export function isFlowVerified(): boolean {
  try { return sessionStorage.getItem(FLOW_DONE_KEY) === "1"; } catch { return false; }
}
export function clearFlowState(): void {
  try {
    sessionStorage.removeItem(FLOW_EMAIL_KEY);
    sessionStorage.removeItem(FLOW_DONE_KEY);
    sessionStorage.removeItem("dp_reset_dev_code");
  } catch {}
}

/** Réinitialise le mot de passe du compte et invalide le token. */
export async function resetPassword(email: string, newPassword: string): Promise<boolean> {
  const account = getStoredAccount();
  const normalized = email.toLowerCase().trim();
  if (!account || account.email !== normalized) return false;
  const passwordHash = await hashPassword(newPassword);
  saveAccount({ ...account, passwordHash });
  // Invalider le token
  const token = getResetToken();
  if (token) {
    try { localStorage.setItem(RESET_KEY, JSON.stringify({ ...token, used: true })); } catch {}
  }
  clearResetToken();
  clearFlowState();
  return true;
}
