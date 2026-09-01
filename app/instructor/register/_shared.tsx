"use client";

import Image from "next/image";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════
   STEPS
═══════════════════════════════════════════════════════════ */

export const STEPS = [
  "Informations personnelles",
  "Adresse",
  "Profil professionnel",
  "Services & tarifs",
  "Véhicule",
  "Disponibilités",
  "Vérification",
] as const;

/* ═══════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════ */

export function IconArrowLeft() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

export function IconArrowRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
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
═══════════════════════════════════════════════════════════ */

export function StepProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full mb-8">
      {/* Mobile */}
      <div className="flex sm:hidden items-center justify-between mb-2">
        <span className="text-xs font-semibold text-navy">
          Étape {currentStep + 1} sur {STEPS.length}
        </span>
        <span className="text-xs text-gray-400">{STEPS[currentStep]}</span>
      </div>
      <div className="sm:hidden w-full bg-gray-100 rounded-full h-1.5">
        <div
          className="bg-navy h-1.5 rounded-full transition-all"
          style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Desktop */}
      <ol className="hidden sm:flex items-start w-full">
        {STEPS.map((label, i) => {
          const done   = i < currentStep;
          const active = i === currentStep;
          const isLast = i === STEPS.length - 1;
          return (
            <li key={label} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                  done  ? "bg-green-dp border-green-dp text-white"
                  : active ? "bg-navy border-navy text-white"
                  : "bg-white border-gray-200 text-gray-300"
                }`}>
                  {done
                    ? <IconCheckSmall />
                    : <span className="text-[10px] font-bold">{i + 1}</span>}
                </div>
                <span
                  className={`mt-1.5 text-[10px] font-medium text-center leading-tight px-0.5 ${
                    active ? "text-navy" : done ? "text-green-dp" : "text-gray-400"
                  }`}
                  style={{ maxWidth: "76px" }}
                >
                  {label}
                </span>
              </div>
              {!isLast && (
                <div className={`h-0.5 flex-1 mx-1 mb-5 rounded-full ${done ? "bg-green-dp" : "bg-gray-200"}`} />
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

export function FieldWrapper({
  label, htmlFor, required, error, hint, children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-navy">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400 leading-relaxed">{hint}</p>}
      {error && <p className="text-xs text-red-500 leading-snug">{error}</p>}
    </div>
  );
}

const inputCls = (hasError?: boolean) =>
  `w-full rounded-xl border px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all
   focus:ring-2 focus:ring-navy/20 focus:border-navy
   ${hasError ? "border-red-300 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"}`;

export function TextInput({
  id, type = "text", placeholder, value, onChange, hasError, autoComplete,
}: {
  id: string; type?: string; placeholder?: string; value: string;
  onChange: (v: string) => void; hasError?: boolean; autoComplete?: string;
}) {
  return (
    <input
      id={id} name={id} type={type} placeholder={placeholder}
      value={value} autoComplete={autoComplete}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls(hasError)}
    />
  );
}

export function SelectInput({
  id, value, onChange, hasError, children,
}: {
  id: string; value: string; onChange: (v: string) => void;
  hasError?: boolean; children: React.ReactNode;
}) {
  return (
    <select
      id={id} name={id} value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputCls(hasError)} cursor-pointer`}
    >
      {children}
    </select>
  );
}

export function TextareaInput({
  id, placeholder, value, onChange, hasError, rows = 4,
}: {
  id: string; placeholder?: string; value: string;
  onChange: (v: string) => void; hasError?: boolean; rows?: number;
}) {
  return (
    <textarea
      id={id} name={id} rows={rows} placeholder={placeholder} value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputCls(hasError)} resize-none leading-relaxed`}
    />
  );
}

/* ── Checkbox-style option ─────────────────────────────── */

export function CheckOption({
  label, checked, onChange,
}: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${
      checked ? "border-navy bg-navy/5" : "border-gray-100 bg-white hover:border-gray-200"
    }`}>
      <input
        type="checkbox" checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div className={`w-4 h-4 rounded flex items-center justify-center border-2 flex-shrink-0 transition-all ${
        checked ? "bg-navy border-navy" : "border-gray-300"
      }`}>
        {checked && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </div>
      <span className={`text-sm font-medium ${checked ? "text-navy" : "text-gray-700"}`}>{label}</span>
    </label>
  );
}

/* ── Toggle button (radio-style or multi-select) ───────── */

export function ToggleButton({
  label, selected, onClick,
}: {
  label: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button" onClick={onClick}
      className={`py-3 px-4 rounded-xl text-sm font-semibold border-2 transition-all ${
        selected
          ? "border-navy bg-navy text-white"
          : "border-gray-100 bg-white text-navy hover:border-navy/30"
      }`}
    >
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   FORM CARD
═══════════════════════════════════════════════════════════ */

export function FormCard({
  title, children,
}: {
  title: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
      <h2 className="text-base font-bold text-navy mb-6">{title}</h2>
      <div className="flex flex-col gap-5">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   NAVIGATION BUTTONS
═══════════════════════════════════════════════════════════ */

export function NavButtons({
  backHref, onContinue, continueLabel = "Continuer",
}: {
  backHref: string; onContinue: () => void; continueLabel?: string;
}) {
  return (
    <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 mt-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-navy transition-colors px-2 py-2"
      >
        <IconArrowLeft />
        Retour
      </Link>
      <button
        type="button" onClick={onContinue}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-navy text-white text-sm font-semibold px-8 py-3 rounded-xl hover:bg-navy-dark transition-colors shadow-sm"
      >
        {continueLabel}
        <IconArrowRight />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE SHELL
═══════════════════════════════════════════════════════════ */

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col bg-surface">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 flex items-center justify-between h-16">
          <Link href="/" className="flex-shrink-0 flex items-center">
            <Image
              src="/brand/logo-horizontal.png" alt="Drive-Path"
              width={160} height={44} className="h-9 w-auto object-contain" priority
            />
          </Link>
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-navy transition-colors px-2 py-1">
            Connexion
          </Link>
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 lg:px-0 py-10">
        {children}
      </div>

      <footer className="bg-white border-t border-gray-100 px-6 py-8 mt-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/logo-horizontal.png" alt="Drive-Path"
              width={100} height={28} className="h-6 w-auto object-contain opacity-50"
            />
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

/* ═══════════════════════════════════════════════════════════
   REQUIRED NOTICE
═══════════════════════════════════════════════════════════ */

export function RequiredNotice() {
  return (
    <p className="text-xs text-gray-400 text-center mt-5">
      Les champs marqués <span className="text-red-400">*</span> sont obligatoires.
    </p>
  );
}
