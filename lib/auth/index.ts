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
  /** Rôle Neon de l'utilisateur (ex. "instructor"). Absent pour les anciennes sessions. */
  role?: string;
};

export type LoginResult =
  | { ok: true; session: AuthSession }
  | { ok: false; error: "too_many_attempts"; retryAfterSeconds: number }
  | { ok: false; error?: undefined };

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

/**
 * Vérifie les identifiants auprès de /api/auth/login (Neon = source de vérité).
 *
 * ⚠️  TEMPORAIRE — La session reste stockée dans sessionStorage (dp_session)
 * pour ne pas casser le reste du prototype tant que les cookies HttpOnly
 * ne sont pas en place.
 */
export async function tryLogin(
  email: string,
  password: string,
): Promise<LoginResult> {
  let data: {
    ok: boolean;
    error?: string;
    retryAfter?: number;
    user?: { email: string; firstName: string; lastName: string; role: string };
  };
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    data = await res.json();
  } catch {
    return { ok: false };
  }

  // Limitation serveur (H1) — délai fourni par le serveur, en secondes.
  if (data.error === "too_many_attempts") {
    const seconds = Number(data.retryAfter);
    return {
      ok: false,
      error: "too_many_attempts",
      retryAfterSeconds: Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 60,
    };
  }

  if (!data.ok || !data.user) return { ok: false };

  const session: AuthSession = {
    email: data.user.email,
    firstName: data.user.firstName,
    lastName: data.user.lastName,
    role: data.user.role,
  };
  saveSession(session);
  return { ok: true, session };
}

/** Message de limitation (H1) à partir du délai serveur, en secondes. */
export function tooManyAttemptsMessage(retryAfterSeconds: number): string {
  if (retryAfterSeconds < 60) {
    return "Trop de tentatives. Réessayez dans moins d'une minute.";
  }
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return `Trop de tentatives. Réessayez dans ${minutes} minute${minutes > 1 ? "s" : ""}.`;
}

/**
 * Déconnecte l'utilisateur.
 *
 * Mécanisme de sécurité principal : appelle /api/auth/logout, qui invalide
 * la session dans Neon (table `sessions`) et supprime le cookie HttpOnly
 * dp_session côté serveur.
 *
 * ⚠️  TEMPORAIRE — clearSession() (sessionStorage["dp_session"]) est
 * conservé ensuite pour compatibilité avec le reste du prototype, mais
 * n'est plus le mécanisme qui protège l'accès aux pages : c'est la
 * session serveur invalidée ci-dessus qui fait foi.
 */
export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // Best-effort — le nettoyage local a lieu quoi qu'il arrive ci-dessous.
  }
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

/* ── Flow de réinitialisation (sessionStorage) ─────────── */
/*  Le code OTP est désormais généré et vérifié côté serveur. */
/*  Ces helpers gèrent uniquement l'état de navigation du flux. */

const FLOW_EMAIL_KEY       = "dp_reset_email";
const FLOW_RESET_TOKEN_KEY = "dp_reset_token";  // token opaque émis par le serveur après OTP validé

export function setFlowEmail(email: string): void {
  try { sessionStorage.setItem(FLOW_EMAIL_KEY, email.toLowerCase().trim()); } catch {}
}
export function getFlowEmail(): string | null {
  try { return sessionStorage.getItem(FLOW_EMAIL_KEY); } catch { return null; }
}

/** Sauvegarde le reset token opaque émis par le serveur après vérification OTP. */
export function saveFlowResetToken(token: string): void {
  try { sessionStorage.setItem(FLOW_RESET_TOKEN_KEY, token); } catch {}
}
/** Récupère le reset token (guard de la page /reset). */
export function getFlowResetToken(): string | null {
  try { return sessionStorage.getItem(FLOW_RESET_TOKEN_KEY); } catch { return null; }
}

export function clearFlowState(): void {
  try {
    sessionStorage.removeItem(FLOW_EMAIL_KEY);
    sessionStorage.removeItem(FLOW_RESET_TOKEN_KEY);
    sessionStorage.removeItem("dp_reset_sent_at");
  } catch {}
}

/**
 * Applique le nouveau hash de mot de passe reçu du serveur dans localStorage.
 * Appelé après validation du reset token par /api/auth/reset-password.
 *
 * ⚠️  TEMPORAIRE — Mise à jour localStorage (prototype sans base de données).
 * À remplacer par un appel DB côté serveur lors de l'étape d'intégration DB.
 */
export function applyPasswordReset(newPasswordHash: string): boolean {
  const account = getStoredAccount();
  if (!account) return false;
  saveAccount({ ...account, passwordHash: newPasswordHash });
  clearFlowState();
  return true;
}
