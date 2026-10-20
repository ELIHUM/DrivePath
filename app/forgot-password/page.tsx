"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setFlowEmail } from "@/lib/auth";

/* ═══════════════════════════════════════════════════════════
   VALIDATION
═══════════════════════════════════════════════════════════ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ═══════════════════════════════════════════════════════════
   PAGE — Étape 1 : Saisie de l'e-mail
═══════════════════════════════════════════════════════════ */

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  /* Erreur d'envoi côté serveur — distincte de emailError, qui ne
     concerne que la validation du champ. Volontairement séparée pour
     ne pas marquer l'adresse en rouge alors que le problème vient du
     service d'envoi : ce serait trompeur et pourrait laisser croire
     que l'adresse elle-même est en cause. */
  const [serverError, setServerError] = useState("");

  const inputCls = (hasErr: boolean) =>
    `w-full rounded-xl border px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all
     focus:ring-2 focus:ring-navy/20 focus:border-navy
     ${hasErr ? "border-red-300 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"}`;

  const validate = (val: string) => {
    if (!val.trim()) return "L'adresse e-mail est obligatoire.";
    if (!EMAIL_RE.test(val.trim())) return "Format d'e-mail invalide.";
    return "";
  };

  const handleChange = (val: string) => {
    setEmail(val);
    if (submitted) setEmailError(validate(val));
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    const err = validate(email);
    if (err) { setEmailError(err); return; }
    setEmailError("");
    setServerError("");
    setLoading(true);

    try {
      const normalized = email.toLowerCase().trim();
      setFlowEmail(normalized);

      // Le code OTP est généré côté serveur — le client n'envoie que l'email
      const res = await fetch("/api/auth/reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });

      const data = await res.json().catch(() => null) as
        { ok?: boolean; sentAt?: number; remainingMs?: number } | null;

      /* ── Un code a déjà été envoyé très récemment (429) ────────── */
      /* Rien n'a été renvoyé, mais le code précédent reste valide    */
      /* (10 min) : on poursuit vers la saisie plutôt que de bloquer  */
      /* l'utilisateur. Le compte à rebours sera rétabli par la page  */
      /* de vérification au premier renvoi. Ce cas suit exactement le */
      /* même chemin qu'un succès — indispensable, car seul un compte */
      /* existant peut déclencher un 429 : le distinguer révélerait   */
      /* l'existence du compte.                                       */
      if (res.status === 429) {
        router.push("/forgot-password/verify");
        return;
      }

      /* ── Échec réel d'envoi (500, 502, 503…) ──────────────────── */
      /* On ne redirige pas : l'utilisateur attendrait un code qui    */
      /* n'arrivera jamais. Message générique — ni cause interne, ni  */
      /* détail Resend, ni indication sur l'existence du compte.      */
      if (!res.ok || !data?.ok) {
        setServerError("L'envoi du code a échoué. Veuillez réessayer plus tard.");
        return;
      }

      // Stocker sentAt pour le cooldown sur la page de vérification
      if (data.sentAt) {
        try { sessionStorage.setItem("dp_reset_sent_at", String(data.sentAt)); } catch {}
      }

      /* Demande acceptée. Une adresse sans compte reçoit volontairement
         { ok: true, sentAt } côté serveur : elle passe donc ici comme
         une autre, et rien ne permet de la distinguer. */
      router.push("/forgot-password/verify");
    } catch {
      // Panne réseau ou réponse illisible — même message générique.
      setServerError("Une erreur est survenue. Veuillez réessayer plus tard.");
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
            <h1 className="text-2xl font-bold text-navy mb-2">Mot de passe oublié ?</h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              Entrez votre adresse e-mail et nous vous enverrons un code pour réinitialiser votre mot de passe.
            </p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 leading-snug">
                {serverError}
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-navy">
                Adresse e-mail <span className="text-red-400">*</span>
              </label>
              <input
                id="email" name="email" type="email"
                placeholder="votre@courriel.ca"
                value={email}
                onChange={(e) => handleChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                autoComplete="email"
                className={inputCls(!!emailError)}
              />
              {emailError && <p className="text-xs text-red-500 leading-snug">{emailError}</p>}
            </div>

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
                  Envoi en cours…
                </>
              ) : "Envoyer le code"}
            </button>

            {/* Message générique — sécurité */}
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Si un compte correspond à cette adresse, un code de réinitialisation vous sera envoyé.
            </p>
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
