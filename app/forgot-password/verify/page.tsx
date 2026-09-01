"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getFlowEmail, getResetToken, verifyResetCode,
  setFlowVerified, generateResetCode, saveResetToken,
  RESET_COOLDOWN_S,
} from "@/lib/auth";

/* ═══════════════════════════════════════════════════════════
   PAGE — Étape 2 : Vérification du code OTP
═══════════════════════════════════════════════════════════ */

export default function VerifyPage() {
  const router = useRouter();

  const [email, setEmail]         = useState<string | null>(null);
  const [digits, setDigits]       = useState(["", "", "", "", "", ""]);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [cooldown, setCooldown]   = useState(0);
  const [resending, setResending] = useState(false);
  const [devCode, setDevCode]     = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ── Load flow state ───────────────────────────────────── */

  useEffect(() => {
    const flowEmail = getFlowEmail();
    if (!flowEmail) {
      router.replace("/forgot-password");
      return;
    }
    setEmail(flowEmail);

    // Dev code banner
    try {
      const dc = sessionStorage.getItem("dp_reset_dev_code");
      if (dc) setDevCode(dc);
    } catch {}

    // Initial cooldown from sentAt
    const token = getResetToken();
    if (token) {
      const elapsed = Math.floor((Date.now() - token.sentAt) / 1000);
      const remaining = RESET_COOLDOWN_S - elapsed;
      if (remaining > 0) setCooldown(remaining);
    }
  }, [router]);

  /* ── Cooldown timer ────────────────────────────────────── */

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(id); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  /* ── OTP input handling ────────────────────────────────── */

  const focusNext = (index: number) => {
    if (index < 5) inputRefs.current[index + 1]?.focus();
  };
  const focusPrev = (index: number) => {
    if (index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleDigitChange = (index: number, val: string) => {
    // Accept only digits, take last char if pasted multiple
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError("");
    if (digit) focusNext(index);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else {
        focusPrev(index);
      }
    } else if (e.key === "ArrowLeft") {
      focusPrev(index);
    } else if (e.key === "ArrowRight") {
      focusNext(index);
    } else if (e.key === "Enter") {
      void handleVerify();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = [...digits];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    setError("");
    const lastFilled = Math.min(text.length, 5);
    inputRefs.current[lastFilled]?.focus();
  };

  /* ── Verify ────────────────────────────────────────────── */

  const handleVerify = useCallback(async () => {
    if (!email) return;
    const code = digits.join("");
    if (code.length < 6) {
      setError("Veuillez entrer les 6 chiffres du code.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = verifyResetCode(email, code);
      if (result === "valid") {
        setFlowVerified();
        router.push("/forgot-password/reset");
      } else if (result === "expired") {
        setError("Ce code a expiré. Veuillez en demander un nouveau.");
      } else if (result === "used") {
        setError("Ce code a déjà été utilisé. Veuillez en demander un nouveau.");
      } else {
        setError("Code incorrect. Vérifiez et réessayez.");
      }
    } finally {
      setLoading(false);
    }
  }, [email, digits, router]);

  /* ── Resend ────────────────────────────────────────────── */

  const handleResend = async () => {
    if (!email || cooldown > 0 || resending) return;
    setResending(true);
    setError("");
    try {
      const code = generateResetCode();
      saveResetToken(email, code);

      const res = await fetch("/api/auth/reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json() as { ok: boolean; devCode?: string };

      if (data.devCode) {
        setDevCode(data.devCode);
        try { sessionStorage.setItem("dp_reset_dev_code", data.devCode); } catch {}
      }

      setCooldown(RESET_COOLDOWN_S);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setResending(false);
    }
  };

  /* ── Code all filled ───────────────────────────────────── */
  const allFilled = digits.every((d) => d !== "");

  /* ── Render ────────────────────────────────────────────── */

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

          {/* Dev banner */}
          {devCode && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 leading-snug">
              <span className="font-semibold">Mode développement — </span>
              Code de test&nbsp;: <span className="font-mono font-bold tracking-widest">{devCode}</span>
            </div>
          )}

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-navy mb-2">Vérification du code</h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              Entrez le code à 6 chiffres envoyé à{" "}
              <span className="font-medium text-gray-600">{email ?? "votre adresse e-mail"}</span>.
            </p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">

            {/* OTP inputs */}
            <div>
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    aria-label={`Chiffre ${i + 1}`}
                    className={`w-11 h-14 text-center text-xl font-bold rounded-xl border outline-none transition-all
                      focus:ring-2 focus:ring-navy/20 focus:border-navy
                      ${error
                        ? "border-red-300 bg-red-50 text-red-700"
                        : d
                          ? "border-navy/40 bg-navy/5 text-navy"
                          : "border-gray-200 bg-white text-gray-800 hover:border-gray-300"
                      }`}
                  />
                ))}
              </div>

              {error && (
                <p className="mt-3 text-xs text-red-500 text-center leading-snug">{error}</p>
              )}
            </div>

            {/* Verify button */}
            <button
              type="button"
              onClick={() => void handleVerify()}
              disabled={loading || !allFilled}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-navy text-white hover:bg-navy-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Vérification…
                </>
              ) : "Vérifier le code"}
            </button>

            {/* Resend */}
            <div className="text-center text-sm">
              {cooldown > 0 ? (
                <p className="text-gray-400">
                  Renvoyer dans{" "}
                  <span className="font-semibold tabular-nums text-gray-600">{cooldown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleResend()}
                  disabled={resending}
                  className="text-navy font-medium hover:underline underline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resending ? "Envoi en cours…" : "Renvoyer le code"}
                </button>
              )}
            </div>

          </div>

          {/* Links */}
          <div className="flex flex-col items-center gap-3 mt-6 text-sm text-gray-400">
            <Link href="/forgot-password" className="hover:text-gray-600 transition-colors">
              ← Modifier l&apos;adresse e-mail
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
