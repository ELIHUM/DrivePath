"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getFlowEmail, isFlowVerified, resetPassword } from "@/lib/auth";

/* ═══════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════ */

function IconEye({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   STRENGTH INDICATOR
═══════════════════════════════════════════════════════════ */

function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: "Très faible", color: "bg-red-400" };
  if (score === 2) return { score, label: "Faible",      color: "bg-orange-400" };
  if (score === 3) return { score, label: "Moyen",       color: "bg-yellow-400" };
  if (score === 4) return { score, label: "Fort",        color: "bg-green-400" };
  return              { score, label: "Très fort",    color: "bg-green-dp" };
}

/* ═══════════════════════════════════════════════════════════
   VALIDATION
═══════════════════════════════════════════════════════════ */

type Errors = { password?: string; confirm?: string };

function validate(password: string, confirm: string): Errors {
  const e: Errors = {};
  if (!password) {
    e.password = "Le mot de passe est obligatoire.";
  } else if (password.length < 8) {
    e.password = "Le mot de passe doit contenir au moins 8 caractères.";
  }
  if (!confirm) {
    e.confirm = "Veuillez confirmer le mot de passe.";
  } else if (password && confirm !== password) {
    e.confirm = "Les mots de passe ne correspondent pas.";
  }
  return e;
}

/* ═══════════════════════════════════════════════════════════
   PAGE — Étape 3 : Nouveau mot de passe
═══════════════════════════════════════════════════════════ */

export default function ResetPage() {
  const router = useRouter();

  const [email, setEmail]       = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [showCf, setShowCf]     = useState(false);
  const [errors, setErrors]     = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);

  const strength = getStrength(password);

  /* ── Guard ─────────────────────────────────────────────── */

  useEffect(() => {
    const flowEmail = getFlowEmail();
    const verified  = isFlowVerified();
    if (!flowEmail || !verified) {
      router.replace("/forgot-password");
      return;
    }
    setEmail(flowEmail);
  }, [router]);

  /* ── Handlers ──────────────────────────────────────────── */

  const inputCls = (hasErr: boolean) =>
    `w-full rounded-xl border px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all pr-11
     focus:ring-2 focus:ring-navy/20 focus:border-navy
     ${hasErr ? "border-red-300 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"}`;

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (submitted) setErrors(validate(val, confirm));
  };

  const handleConfirmChange = (val: string) => {
    setConfirm(val);
    if (submitted) setErrors(validate(password, val));
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    const errs = validate(password, confirm);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (!email) return;

    setLoading(true);
    try {
      const ok = await resetPassword(email, password);
      if (ok) {
        setSuccess(true);
      } else {
        setErrors({ password: "Impossible de réinitialiser le mot de passe. Veuillez recommencer." });
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ────────────────────────────────────── */

  if (success) {
    return (
      <main className="flex min-h-screen flex-col bg-surface">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 lg:px-10 flex items-center justify-between h-16">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Image src="/brand/logo-horizontal.png" alt="Drive-Path"
                width={160} height={44} className="h-9 w-auto object-contain" priority />
            </Link>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
          <div className="w-full max-w-sm text-center">
            <div className="w-16 h-16 rounded-full bg-green-dp/10 text-green-dp flex items-center justify-center mx-auto mb-6">
              <IconCheck />
            </div>
            <h1 className="text-2xl font-bold text-navy mb-3">Mot de passe réinitialisé</h1>
            <p className="text-sm text-gray-400 leading-relaxed mb-8">
              Votre nouveau mot de passe est actif. Vous pouvez maintenant vous connecter.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full py-3 rounded-xl text-sm font-semibold bg-navy text-white hover:bg-navy-dark transition-colors"
            >
              Se connecter
            </Link>
          </div>
        </div>

        <footer className="bg-white border-t border-gray-100 px-6 py-8">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-3">
              <Image src="/brand/logo-horizontal.png" alt="Drive-Path"
                width={100} height={28} className="h-6 w-auto object-contain opacity-50" />
              <span>© {new Date().getFullYear()} Drive-Path</span>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="#" className="hover:text-gray-600 transition-colors">Confidentialité</Link>
              <Link href="/terms" className="hover:text-gray-600 transition-colors">Conditions d&apos;utilisation</Link>
            </nav>
          </div>
        </footer>
      </main>
    );
  }

  /* ── Normal form ───────────────────────────────────────── */

  return (
    <main className="flex min-h-screen flex-col bg-surface">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 flex items-center justify-between h-16">
          <Link href="/" className="flex-shrink-0 flex items-center">
            <Image src="/brand/logo-horizontal.png" alt="Drive-Path"
              width={160} height={44} className="h-9 w-auto object-contain" priority />
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-navy mb-2">Nouveau mot de passe</h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              Choisissez un nouveau mot de passe sécurisé pour votre compte.
            </p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-navy">
                Nouveau mot de passe <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="password" name="password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void handleSubmit()}
                  autoComplete="new-password"
                  className={inputCls(!!errors.password)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy transition-colors p-1"
                  aria-label={showPw ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  <IconEye open={showPw} />
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 leading-snug">{errors.password}</p>
              )}

              {/* Strength bar */}
              {password && (
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300
                          ${strength.score >= n ? strength.color : "bg-gray-100"}`}
                      />
                    ))}
                  </div>
                  {strength.label && (
                    <p className="text-xs text-gray-400">{strength.label}</p>
                  )}
                </div>
              )}
            </div>

            {/* Confirm */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm" className="text-sm font-semibold text-navy">
                Confirmer le mot de passe <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirm" name="confirm"
                  type={showCf ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => handleConfirmChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void handleSubmit()}
                  autoComplete="new-password"
                  className={inputCls(!!errors.confirm)}
                />
                <button
                  type="button"
                  onClick={() => setShowCf((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy transition-colors p-1"
                  aria-label={showCf ? "Masquer la confirmation" : "Afficher la confirmation"}
                >
                  <IconEye open={showCf} />
                </button>
              </div>
              {errors.confirm && (
                <p className="text-xs text-red-500 leading-snug">{errors.confirm}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-navy text-white hover:bg-navy-dark transition-colors mt-1 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Enregistrement…
                </>
              ) : "Réinitialiser le mot de passe"}
            </button>

          </div>

          {/* Links */}
          <div className="flex flex-col items-center gap-3 mt-6 text-sm text-gray-400">
            <Link href="/login" className="hover:text-gray-600 transition-colors">
              ← Retour à la connexion
            </Link>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-3">
            <Image src="/brand/logo-horizontal.png" alt="Drive-Path"
              width={100} height={28} className="h-6 w-auto object-contain opacity-50" />
            <span>© {new Date().getFullYear()} Drive-Path</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="#" className="hover:text-gray-600 transition-colors">Confidentialité</Link>
            <Link href="/terms" className="hover:text-gray-600 transition-colors">Conditions d&apos;utilisation</Link>
          </nav>
        </div>
      </footer>

    </main>
  );
}
