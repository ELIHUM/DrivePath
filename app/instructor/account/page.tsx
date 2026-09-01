"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveStep, loadStep, DEFAULTS } from "../register/_store";
import type { Step0Data } from "../register/_store";

/* ═══════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════ */

function IconArrowLeft() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

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

function IconCheckSmall() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   STEP PROGRESS
   Step 0 maps to position 0 in the 8-step visual
   (Account + the 7 existing steps)
═══════════════════════════════════════════════════════════ */

const ALL_STEPS = [
  "Compte",
  "Infos personnelles",
  "Adresse",
  "Profil pro",
  "Services",
  "Véhicule",
  "Disponibilités",
  "Vérification",
] as const;

function StepProgress() {
  return (
    <div className="w-full mb-8">
      {/* Mobile */}
      <div className="flex sm:hidden items-center justify-between mb-2">
        <span className="text-xs font-semibold text-navy">Étape 1 sur {ALL_STEPS.length}</span>
        <span className="text-xs text-gray-400">{ALL_STEPS[0]}</span>
      </div>
      <div className="sm:hidden w-full bg-gray-100 rounded-full h-1.5">
        <div className="bg-navy h-1.5 rounded-full" style={{ width: `${(1 / ALL_STEPS.length) * 100}%` }} />
      </div>

      {/* Desktop */}
      <ol className="hidden sm:flex items-start w-full">
        {ALL_STEPS.map((label, i) => {
          const active = i === 0;
          const isLast = i === ALL_STEPS.length - 1;
          return (
            <li key={label} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                  active ? "bg-navy border-navy text-white" : "bg-white border-gray-200 text-gray-300"
                }`}>
                  {active
                    ? <IconCheckSmall />
                    : <span className="text-[10px] font-bold">{i + 1}</span>}
                </div>
                <span
                  className={`mt-1.5 text-[10px] font-medium text-center leading-tight px-0.5 ${
                    active ? "text-navy" : "text-gray-400"
                  }`}
                  style={{ maxWidth: "68px" }}
                >
                  {label}
                </span>
              </div>
              {!isLast && (
                <div className="h-0.5 flex-1 mx-1 mb-5 rounded-full bg-gray-200" />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   FIELD COMPONENTS
═══════════════════════════════════════════════════════════ */

function FieldWrapper({
  label, htmlFor, required, error, children,
}: {
  label: string; htmlFor: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-navy">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 leading-snug">{error}</p>}
    </div>
  );
}

const baseCls = (hasError?: boolean) =>
  `w-full rounded-xl border px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all
   focus:ring-2 focus:ring-navy/20 focus:border-navy
   ${hasError ? "border-red-300 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"}`;

function TextInput({
  id, type = "text", placeholder, value, onChange, hasError, autoComplete,
}: {
  id: string; type?: string; placeholder?: string; value: string;
  onChange: (v: string) => void; hasError?: boolean; autoComplete?: string;
}) {
  return (
    <input id={id} name={id} type={type} placeholder={placeholder} value={value}
      autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)}
      className={baseCls(hasError)}
    />
  );
}

function PasswordInput({
  id, placeholder, value, onChange, hasError, autoComplete,
}: {
  id: string; placeholder?: string; value: string;
  onChange: (v: string) => void; hasError?: boolean; autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id} name={id} type={visible ? "text" : "password"}
        placeholder={placeholder} value={value}
        autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)}
        className={`${baseCls(hasError)} pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy transition-colors p-1"
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      >
        <IconEye open={visible} />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PASSWORD STRENGTH INDICATOR
═══════════════════════════════════════════════════════════ */

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score =
    (password.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0);

  const levels: { label: string; color: string; bars: number }[] = [
    { label: "Très faible", color: "bg-red-400",   bars: 1 },
    { label: "Faible",      color: "bg-orange-400", bars: 2 },
    { label: "Moyen",       color: "bg-amber-400",  bars: 3 },
    { label: "Fort",        color: "bg-green-dp",   bars: 4 },
  ];
  const level = levels[Math.max(0, Math.min(score - 1, 3))];

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`h-1 flex-1 rounded-full transition-all ${n <= level.bars ? level.color : "bg-gray-100"}`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-400 w-16 text-right">{level.label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   FORM STATE & VALIDATION
═══════════════════════════════════════════════════════════ */

type FormState = Step0Data & {
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
};

type Errors = Partial<Record<keyof FormState, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+?\d[\d\s.\-()]{7,}\d)$/;

function validate(f: FormState): Errors {
  const e: Errors = {};
  if (!f.firstName.trim())           e.firstName = "Le prénom est obligatoire.";
  if (!f.lastName.trim())            e.lastName  = "Le nom est obligatoire.";
  if (!f.email.trim())               e.email = "L'adresse e-mail est obligatoire.";
  else if (!EMAIL_RE.test(f.email.trim())) e.email = "Format d'e-mail invalide.";
  if (!f.phone.trim())               e.phone = "Le téléphone est obligatoire.";
  else if (!PHONE_RE.test(f.phone.trim())) e.phone = "Numéro de téléphone invalide.";
  if (!f.password)                   e.password = "Le mot de passe est obligatoire.";
  else if (f.password.length < 8)    e.password = "Le mot de passe doit contenir au moins 8 caractères.";
  if (!f.confirmPassword)            e.confirmPassword = "Veuillez confirmer le mot de passe.";
  else if (f.confirmPassword !== f.password) e.confirmPassword = "Les mots de passe ne correspondent pas.";
  if (!f.acceptedTerms)              e.acceptedTerms = "Vous devez accepter les conditions d'utilisation.";
  return e;
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */

export default function InstructorAccountPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(() => ({
    ...loadStep<Step0Data>(0, DEFAULTS.step0),
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (submitted) setErrors(validate(next));
      return next;
    });
  };

  const handleContinue = () => {
    setSubmitted(true);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      // Persist only non-sensitive fields
      const { password: _, confirmPassword: __, acceptedTerms: ___, ...persistable } = form;
      void _; void __; void ___;
      saveStep<Step0Data>(0, persistable);
      // Pre-fill step 1 with the same name/email/phone so the user doesn't re-enter them
      saveStep(1, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        birthDate: "",
      });
      router.push("/instructor/register");
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
          <Link href="/login"
            className="text-sm font-medium text-gray-600 hover:text-navy transition-colors px-2 py-1">
            Connexion
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 lg:px-0 py-10">

        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-navy mb-2">
            Créez votre compte moniteur
          </h1>
          <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
            Commencez par renseigner vos informations de connexion.
            Vous pourrez compléter votre profil professionnel à l&apos;étape suivante.
          </p>
        </div>

        <StepProgress />

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <h2 className="text-base font-bold text-navy mb-6">Informations de compte</h2>

          <div className="flex flex-col gap-5">

            {/* Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldWrapper label="Prénom" htmlFor="firstName" required error={errors.firstName}>
                <TextInput id="firstName" placeholder="Jean" value={form.firstName}
                  onChange={(v) => update("firstName", v)} hasError={!!errors.firstName}
                  autoComplete="given-name" />
              </FieldWrapper>
              <FieldWrapper label="Nom" htmlFor="lastName" required error={errors.lastName}>
                <TextInput id="lastName" placeholder="Dupont" value={form.lastName}
                  onChange={(v) => update("lastName", v)} hasError={!!errors.lastName}
                  autoComplete="family-name" />
              </FieldWrapper>
            </div>

            {/* Email */}
            <FieldWrapper label="Adresse e-mail" htmlFor="email" required error={errors.email}>
              <TextInput id="email" type="email" placeholder="jean.dupont@exemple.fr"
                value={form.email} onChange={(v) => update("email", v)}
                hasError={!!errors.email} autoComplete="email" />
            </FieldWrapper>

            {/* Phone */}
            <FieldWrapper label="Téléphone" htmlFor="phone" required error={errors.phone}>
              <TextInput id="phone" type="tel" placeholder="06 12 34 56 78"
                value={form.phone} onChange={(v) => update("phone", v)}
                hasError={!!errors.phone} autoComplete="tel" />
            </FieldWrapper>

            <div className="border-t border-gray-100 pt-1" />

            {/* Password */}
            <FieldWrapper label="Mot de passe" htmlFor="password" required error={errors.password}>
              <PasswordInput id="password" placeholder="8 caractères minimum"
                value={form.password} onChange={(v) => update("password", v)}
                hasError={!!errors.password} autoComplete="new-password" />
              <PasswordStrength password={form.password} />
            </FieldWrapper>

            {/* Confirm */}
            <FieldWrapper label="Confirmer le mot de passe" htmlFor="confirmPassword" required
              error={errors.confirmPassword}>
              <PasswordInput id="confirmPassword" placeholder="Répétez le mot de passe"
                value={form.confirmPassword} onChange={(v) => update("confirmPassword", v)}
                hasError={!!errors.confirmPassword} autoComplete="new-password" />
            </FieldWrapper>

            <div className="border-t border-gray-100 pt-1" />

            {/* Terms */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox" checked={form.acceptedTerms}
                  onChange={(e) => update("acceptedTerms", e.target.checked)}
                  className="sr-only"
                />
                <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  form.acceptedTerms ? "bg-navy border-navy" : errors.acceptedTerms ? "border-red-400" : "border-gray-300"
                }`}>
                  {form.acceptedTerms && (
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
                      stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors">
                  J&apos;accepte les{" "}
                  <Link href="/terms" className="text-navy font-medium hover:underline underline-offset-2">
                    conditions d&apos;utilisation
                  </Link>{" "}
                  et la politique de confidentialité de Drive-Path.
                </span>
              </label>
              {errors.acceptedTerms && (
                <p className="text-xs text-red-500 ml-7">{errors.acceptedTerms}</p>
              )}
            </div>

          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 mt-6">
          <Link href="/instructor"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-navy transition-colors px-2 py-2">
            <IconArrowLeft />
            Retour
          </Link>
          <button
            type="button" onClick={handleContinue}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-navy text-white text-sm font-semibold px-8 py-3 rounded-xl hover:bg-navy-dark transition-colors shadow-sm"
          >
            Continuer
            <IconArrowRight />
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-5">
          Les champs marqués <span className="text-red-400">*</span> sont obligatoires.
        </p>

      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 px-6 py-8 mt-8">
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
