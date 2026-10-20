"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { tryLogin, tooManyAttemptsMessage } from "@/lib/auth";

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

/* ═══════════════════════════════════════════════════════════
   VALIDATION
═══════════════════════════════════════════════════════════ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = { email?: string; password?: string };

function validate(email: string, password: string): Errors {
  const e: Errors = {};
  if (!email.trim()) e.email = "L'adresse e-mail est obligatoire.";
  else if (!EMAIL_RE.test(email.trim())) e.email = "Format d'e-mail invalide.";
  if (!password) e.password = "Le mot de passe est obligatoire.";
  return e;
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [errors, setErrors]     = useState<Errors>({});
  const [authError, setAuthError] = useState("");
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const inputCls = (hasErr?: boolean) =>
    `w-full rounded-xl border px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all
     focus:ring-2 focus:ring-navy/20 focus:border-navy
     ${hasErr ? "border-red-300 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"}`;

  const handleChange = (field: "email" | "password", val: string) => {
    if (field === "email") setEmail(val);
    else setPassword(val);
    setAuthError("");
    if (submitted) {
      setErrors(validate(
        field === "email" ? val : email,
        field === "password" ? val : password,
      ));
    }
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    const errs = validate(email, password);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setAuthError("");
    try {
      const result = await tryLogin(email, password);
      if (result.ok) {
        router.push("/instructor/account");
      } else if (result.error === "too_many_attempts") {
        setAuthError(tooManyAttemptsMessage(result.retryAfterSeconds));
      } else {
        setAuthError("Adresse e-mail ou mot de passe incorrect.");
      }
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-navy mb-2">Connexion</h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              Accédez à votre espace moniteur Drive-Path.
            </p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">

            {/* Auth error */}
            {authError && (
              <div role="alert" className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 leading-snug">
                {authError}
              </div>
            )}

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-navy">
                Adresse e-mail <span className="text-red-400">*</span>
              </label>
              <input
                id="email" name="email" type="email"
                placeholder="votre@courriel.ca"
                value={email}
                onChange={(e) => handleChange("email", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                autoComplete="email"
                className={inputCls(!!errors.email)}
              />
              {errors.email && (
                <p className="text-xs text-red-500 leading-snug">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-navy">
                  Mot de passe <span className="text-red-400">*</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-gray-400 hover:text-navy transition-colors"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password" name="password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  autoComplete="current-password"
                  className={`${inputCls(!!errors.password)} pr-11`}
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
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-navy text-white hover:bg-navy-dark transition-colors mt-1 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Connexion en cours…
                </>
              ) : "Se connecter"}
            </button>

          </div>

          {/* Links */}
          <div className="flex flex-col items-center gap-3 mt-6 text-sm text-gray-400">
            <span>Pas encore de compte ?{" "}
              <Link href="/instructor/account"
                className="text-navy font-medium hover:underline underline-offset-2">
                Créer mon compte moniteur
              </Link>
            </span>
            <Link href="/" className="hover:text-gray-600 transition-colors">
              ← Retour à l&apos;accueil
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
            <Link href="#" className="hover:text-gray-600 transition-colors">Contact</Link>
          </nav>
        </div>
      </footer>

    </main>
  );
}
