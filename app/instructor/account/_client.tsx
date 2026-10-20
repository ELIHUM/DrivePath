"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { DEFAULTS, saveStep } from "../register/_store";
import type { Step0Data, Step1Data, Step2Data, Step3Data, Step4Data, Step5Data, Step6Data } from "../register/_store";
import { FieldWrapper, TextInput, SelectInput, TextareaInput, CheckOption, ToggleButton } from "../register/_shared";
import {
  createDraftAccount, logout,
  getProfilePhoto, saveProfilePhoto, clearProfilePhoto,
} from "@/lib/auth";
import type { AuthSession, StoredAccount, ProfileData } from "@/lib/auth";
// Import de type uniquement (erasé à la compilation) — ne tire aucun code
// serveur (next/headers, DB) dans le bundle client.
import type { PublicUser } from "@/lib/auth/session";

/* ═══════════════════════════════════════════════════════════
   SECTION TYPE
═══════════════════════════════════════════════════════════ */

type Section = "step1" | "step2" | "step3" | "step4" | "step5" | "step6";

/* ═══════════════════════════════════════════════════════════
   CONSTANTS (for edit forms)
═══════════════════════════════════════════════════════════ */

const PROVINCES = [
  "Alberta", "Colombie-Britannique", "Île-du-Prince-Édouard",
  "Manitoba", "Nouveau-Brunswick", "Nouvelle-Écosse", "Nunavut",
  "Ontario", "Québec", "Saskatchewan", "Terre-Neuve-et-Labrador",
  "Territoires du Nord-Ouest", "Yukon",
] as const;

const STATUSES = ["Moniteur indépendant", "Auto-école", "Moniteur salarié", "Autre"] as const;

const SPECIALTIES = [
  "Classe 5 (véhicule de promenade)", "Conduite supervisée", "Perfectionnement",
  "Reprise de confiance", "Conduite sur route / autoroute", "Conduite après obtention du permis",
] as const;

const LESSON_TYPES = [
  "Leçon de conduite", "Préparation à l'examen de conduite", "Perfectionnement",
  "Reprise de confiance", "Évaluation des compétences",
  "Conduite sur autoroute", "Préparation à la conduite hivernale",
] as const;

const DURATIONS = [
  { id: "30 min", label: "30 min" },
  { id: "45 min", label: "45 min" },
  { id: "60 min", label: "60 min" },
  { id: "90 min", label: "90 min", badge: "⭐ Meilleur choix" },
  { id: "120 min", label: "2 h", badge: "🔥 Meilleure valeur" },
] as const;

const DURATION_MULTIPLIERS: Record<string, number> = {
  "30 min": 0.60, "45 min": 0.85, "60 min": 1.00, "90 min": 1.40, "120 min": 1.80,
};

const PACKAGES = ["5 leçons", "10 leçons", "Forfait préparation à l'examen"] as const;

const DAYS = [
  { key: "lun", label: "Lundi", short: "Lun" }, { key: "mar", label: "Mardi", short: "Mar" },
  { key: "mer", label: "Mercredi", short: "Mer" }, { key: "jeu", label: "Jeudi", short: "Jeu" },
  { key: "ven", label: "Vendredi", short: "Ven" }, { key: "sam", label: "Samedi", short: "Sam" },
  { key: "dim", label: "Dimanche", short: "Dim" },
] as const;

const SLOTS = [
  { key: "morning" as const,   label: "Matin",      desc: "8 h – 12 h"  },
  { key: "afternoon" as const, label: "Après-midi", desc: "14 h – 18 h" },
  { key: "evening" as const,   label: "Soirée",     desc: "18 h – 21 h" },
];

const CURRENT_YEAR = new Date().getFullYear();
const CA_POSTAL_RE = /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+?\d[\d\s.\-()]{7,}\d)$/;

function suggestPrice(rate: number, durId: string): string {
  return String(Math.round(rate * (DURATION_MULTIPLIERS[durId] ?? 1)));
}

/* ═══════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════ */

function IconArrowLeft() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconEye({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function IconCheckSmall() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function IconUserPlaceholder() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className="text-gray-300" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   SHARED EDIT WRAPPERS
═══════════════════════════════════════════════════════════ */

function EditShell({
  title, onBack, onSave, saving, children,
}: {
  title: string; onBack: () => void; onSave: () => void;
  saving?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 mb-2">
        <button type="button" onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-navy transition-colors">
          <IconArrowLeft /> Retour
        </button>
        <span className="text-gray-200">|</span>
        <h2 className="text-base font-bold text-navy">{title}</h2>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col gap-5">{children}</div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
        <button type="button" onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-navy transition-colors px-2 py-2">
          <IconArrowLeft /> Retour sans enregistrer
        </button>
        <button type="button" onClick={onSave} disabled={saving}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-navy text-white text-sm font-semibold px-8 py-3 rounded-xl hover:bg-navy-dark transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
          {saving ? "Enregistrement…" : "Enregistrer les modifications"}
          {!saving && <IconArrowRight />}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PHOTO PICKER (profile edit)
═══════════════════════════════════════════════════════════ */

function PhotoPicker({
  photoUrl, onSelect, onRemove,
}: {
  photoUrl: string | null; onSelect: (url: string) => void; onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const d = ev.target?.result as string; if (d) onSelect(d); };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [onSelect]);

  return (
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 rounded-2xl bg-surface border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
        {photoUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={photoUrl} alt="Aperçu" className="w-full h-full object-cover" />
          : <span className="text-gray-300"><IconUserPlaceholder /></span>}
      </div>
      <div className="flex flex-col gap-2">
        <button type="button" onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 text-sm font-medium text-navy border border-gray-200 px-4 py-2 rounded-xl hover:border-navy/30 hover:bg-navy/5 transition-colors">
          <IconCamera /> {photoUrl ? "Changer la photo" : "Sélectionner une photo"}
        </button>
        {photoUrl && (
          <button type="button" onClick={onRemove}
            className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors text-left px-1">
            Supprimer
          </button>
        )}
        <p className="text-xs text-gray-400">JPG, PNG, WEBP — 400 × 400 px recommandé.</p>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
        onChange={handleFile} className="sr-only" aria-label="Sélectionner une photo" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VALIDATION FUNCTIONS
═══════════════════════════════════════════════════════════ */

function validateStep1(d: Step1Data) {
  const e: Partial<Record<keyof Step1Data, string>> = {};
  if (!d.firstName.trim()) e.firstName = "Le prénom est obligatoire.";
  if (!d.lastName.trim())  e.lastName  = "Le nom est obligatoire.";
  if (!d.email.trim())     e.email = "L'adresse courriel est obligatoire.";
  else if (!EMAIL_RE.test(d.email.trim())) e.email = "Format invalide.";
  if (!d.phone.trim())     e.phone = "Le téléphone est obligatoire.";
  else if (!PHONE_RE.test(d.phone.trim())) e.phone = "Numéro invalide.";
  if (!d.birthDate) { e.birthDate = "La date de naissance est obligatoire."; }
  else {
    const birth = new Date(d.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear() -
      (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
    if (isNaN(birth.getTime())) e.birthDate = "Date invalide.";
    else if (age < 18) e.birthDate = "Vous devez avoir au moins 18 ans.";
    else if (age > 100) e.birthDate = "Veuillez vérifier la date.";
  }
  return e;
}

function validateStep2(d: Step2Data) {
  const e: Partial<Record<keyof Step2Data, string>> = {};
  if (!d.street.trim())   e.street   = "L'adresse est obligatoire.";
  if (!d.city.trim())     e.city     = "La ville est obligatoire.";
  if (!d.province.trim()) e.province = "La province est obligatoire.";
  if (!d.postalCode.trim()) e.postalCode = "Le code postal est obligatoire.";
  else if (!CA_POSTAL_RE.test(d.postalCode.trim())) e.postalCode = "Code postal canadien invalide (ex. E1A 3H6).";
  if (!d.activityRadius)  e.activityRadius = "Sélectionnez une zone d'activité.";
  return e;
}

function validateStep3(d: Step3Data) {
  const e: Partial<Record<keyof Step3Data, string>> = {};
  if (!d.status.trim())              e.status = "Le statut est obligatoire.";
  if (!d.certificationNumber.trim()) e.certificationNumber = "Le numéro de permis est obligatoire.";
  if (!d.yearsExperience.trim())     e.yearsExperience = "L'expérience est obligatoire.";
  else {
    const y = Number(d.yearsExperience);
    if (isNaN(y) || y < 0 || y > 60) e.yearsExperience = "Valeur invalide (0–60 ans).";
  }
  if (d.bio.trim().length > 0 && d.bio.trim().length < 30)
    e.bio = "La présentation doit contenir au moins 30 caractères.";
  return e;
}

type Step4Errors = Partial<Record<"lessonTypes" | "pricePerHour" | "durations" | "durationPrices", string>>;
function validateStep4(d: Step4Data): Step4Errors {
  const e: Step4Errors = {};
  if (d.lessonTypes.length === 0) e.lessonTypes = "Sélectionnez au moins un type de leçon.";
  if (!d.pricePerHour.trim()) { e.pricePerHour = "Le tarif horaire est obligatoire."; }
  else { const n = Number(d.pricePerHour); if (isNaN(n) || n < 10) e.pricePerHour = "Minimum 10 $."; else if (n > 200) e.pricePerHour = "Maximum 200 $."; }
  if (d.durations.length === 0) { e.durations = "Sélectionnez au moins une durée."; }
  else {
    for (const dur of d.durations) {
      const p = d.durationPrices[dur];
      if (!p || !p.trim()) { e.durationPrices = "Tous les tarifs par durée sont obligatoires."; break; }
      if (isNaN(Number(p)) || Number(p) <= 0) { e.durationPrices = "Les tarifs doivent être supérieurs à 0."; break; }
    }
  }
  return e;
}

function validateStep5(d: Step5Data) {
  const e: Partial<Record<keyof Step5Data, string>> = {};
  if (!d.brand.trim())  e.brand  = "La marque est obligatoire.";
  if (!d.model.trim())  e.model  = "Le modèle est obligatoire.";
  if (!d.year.trim())   { e.year = "L'année est obligatoire."; }
  else { const y = Number(d.year); if (isNaN(y) || y < 1990 || y > CURRENT_YEAR + 1) e.year = `Année entre 1990 et ${CURRENT_YEAR + 1}.`; }
  if (!d.gearbox)       e.gearbox = "Sélectionnez le type de boîte.";
  return e;
}

type Step6Errors = Partial<Record<"days" | "slots", string>>;
function validateStep6(d: Step6Data): Step6Errors {
  const e: Step6Errors = {};
  if (d.days.length === 0) e.days = "Sélectionnez au moins un jour.";
  if (!d.morning && !d.afternoon && !d.evening) e.slots = "Sélectionnez au moins une plage horaire.";
  return e;
}

/* ═══════════════════════════════════════════════════════════
   EDIT FORMS
═══════════════════════════════════════════════════════════ */

function EditStep1({
  initial, initialPhoto, onSave, onBack,
}: {
  initial: Step1Data; initialPhoto: string | null;
  onSave: (data: Step1Data, photo: string | null) => void; onBack: () => void;
}) {
  const [form, setForm] = useState<Step1Data>(initial);
  const [photo, setPhoto] = useState<string | null>(initialPhoto);
  const [errors, setErrors] = useState<Partial<Record<keyof Step1Data, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof Step1Data>(k: K, v: Step1Data[K]) =>
    setForm((p) => { const n = { ...p, [k]: v }; if (submitted) setErrors(validateStep1(n)); return n; });

  const handleSave = () => {
    setSubmitted(true);
    const errs = validateStep1(form);
    setErrors(errs);
    if (Object.keys(errs).length === 0) onSave(form, photo);
  };

  return (
    <EditShell title="Informations personnelles" onBack={onBack} onSave={handleSave}>
      <FieldWrapper label="Photo de profil" htmlFor="photo">
        <PhotoPicker photoUrl={photo}
          onSelect={(url) => { saveProfilePhoto(url); setPhoto(url); }}
          onRemove={() => { clearProfilePhoto(); setPhoto(null); }} />
      </FieldWrapper>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldWrapper label="Prénom" htmlFor="e1-firstName" required error={errors.firstName}>
          <TextInput id="e1-firstName" value={form.firstName} onChange={(v) => update("firstName", v)} hasError={!!errors.firstName} autoComplete="given-name" />
        </FieldWrapper>
        <FieldWrapper label="Nom" htmlFor="e1-lastName" required error={errors.lastName}>
          <TextInput id="e1-lastName" value={form.lastName} onChange={(v) => update("lastName", v)} hasError={!!errors.lastName} autoComplete="family-name" />
        </FieldWrapper>
      </div>
      <FieldWrapper label="Adresse courriel" htmlFor="e1-email" required error={errors.email}>
        <TextInput id="e1-email" type="email" value={form.email} onChange={(v) => update("email", v)} hasError={!!errors.email} autoComplete="email" />
      </FieldWrapper>
      <FieldWrapper label="Téléphone" htmlFor="e1-phone" required error={errors.phone}>
        <TextInput id="e1-phone" type="tel" value={form.phone} onChange={(v) => update("phone", v)} hasError={!!errors.phone} autoComplete="tel" />
      </FieldWrapper>
      <FieldWrapper label="Date de naissance" htmlFor="e1-birthDate" required error={errors.birthDate}>
        <TextInput id="e1-birthDate" type="date" value={form.birthDate} onChange={(v) => update("birthDate", v)} hasError={!!errors.birthDate} />
      </FieldWrapper>
    </EditShell>
  );
}

function EditStep2({ initial, onSave, onBack }: { initial: Step2Data; onSave: (d: Step2Data) => void; onBack: () => void }) {
  const [form, setForm] = useState<Step2Data>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof Step2Data, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof Step2Data>(k: K, v: Step2Data[K]) =>
    setForm((p) => { const n = { ...p, [k]: v }; if (submitted) setErrors(validateStep2(n)); return n; });

  const normalizePostal = () => {
    const raw = form.postalCode.trim().toUpperCase().replace(/\s/g, "");
    if (raw.length === 6) setForm((p) => ({ ...p, postalCode: `${raw.slice(0, 3)} ${raw.slice(3)}` }));
  };

  const handleSave = () => {
    setSubmitted(true);
    const errs = validateStep2(form);
    setErrors(errs);
    if (Object.keys(errs).length === 0) onSave(form);
  };

  return (
    <EditShell title="Adresse et zone d'activité" onBack={onBack} onSave={handleSave}>
      <FieldWrapper label="Adresse" htmlFor="e2-street" required error={errors.street}>
        <TextInput id="e2-street" placeholder="123, rue Principale" value={form.street} onChange={(v) => update("street", v)} hasError={!!errors.street} autoComplete="street-address" />
      </FieldWrapper>
      <FieldWrapper label="Appartement / bureau" htmlFor="e2-complement">
        <TextInput id="e2-complement" placeholder="App. 4B" value={form.complement} onChange={(v) => update("complement", v)} autoComplete="address-line2" />
      </FieldWrapper>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldWrapper label="Ville" htmlFor="e2-city" required error={errors.city}>
          <TextInput id="e2-city" placeholder="Moncton" value={form.city} onChange={(v) => update("city", v)} hasError={!!errors.city} autoComplete="address-level2" />
        </FieldWrapper>
        <FieldWrapper label="Code postal" htmlFor="e2-postal" required error={errors.postalCode}>
          <TextInput id="e2-postal" placeholder="E1A 3H6" value={form.postalCode}
            onChange={(v) => update("postalCode", v.toUpperCase())}
            hasError={!!errors.postalCode} autoComplete="postal-code" />
        </FieldWrapper>
      </div>
      <FieldWrapper label="Province / Territoire" htmlFor="e2-province" required error={errors.province}>
        <SelectInput id="e2-province" value={form.province} onChange={(v) => update("province", v)} hasError={!!errors.province}>
          <option value="">Sélectionnez…</option>
          {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
        </SelectInput>
      </FieldWrapper>
      <FieldWrapper label="Zone d'activité" htmlFor="e2-radius" required error={errors.activityRadius}
        hint="Rayon maximal dans lequel vous proposez des leçons.">
        <SelectInput id="e2-radius" value={form.activityRadius} onChange={(v) => update("activityRadius", v)} hasError={!!errors.activityRadius}>
          <option value="">Sélectionnez…</option>
          <option value="5">Jusqu'à 5 km</option>
          <option value="10">Jusqu'à 10 km</option>
          <option value="20">Jusqu'à 20 km</option>
          <option value="50">Jusqu'à 50 km</option>
        </SelectInput>
      </FieldWrapper>
      {/* trigger normalizePostal on blur via a hidden effect */}
      <input type="hidden" onBlur={normalizePostal} />
    </EditShell>
  );
}

function EditStep3({ initial, onSave, onBack }: { initial: Step3Data; onSave: (d: Step3Data) => void; onBack: () => void }) {
  const [form, setForm] = useState<Step3Data>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof Step3Data, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof Step3Data>(k: K, v: Step3Data[K]) =>
    setForm((p) => { const n = { ...p, [k]: v }; if (submitted) setErrors(validateStep3(n)); return n; });

  const toggleSpecialty = (s: string) =>
    update("specialties", form.specialties.includes(s) ? form.specialties.filter((x) => x !== s) : [...form.specialties, s]);

  const handleSave = () => {
    setSubmitted(true);
    const errs = validateStep3(form);
    setErrors(errs);
    if (Object.keys(errs).length === 0) onSave(form);
  };

  return (
    <EditShell title="Profil professionnel" onBack={onBack} onSave={handleSave}>
      <FieldWrapper label="Statut" htmlFor="e3-status" required error={errors.status}>
        <SelectInput id="e3-status" value={form.status} onChange={(v) => update("status", v)} hasError={!!errors.status}>
          <option value="">Sélectionnez…</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </SelectInput>
      </FieldWrapper>
      <FieldWrapper label="Numéro de permis / licence" htmlFor="e3-cert" required error={errors.certificationNumber}>
        <TextInput id="e3-cert" placeholder="NB-12345" value={form.certificationNumber} onChange={(v) => update("certificationNumber", v)} hasError={!!errors.certificationNumber} />
      </FieldWrapper>
      <FieldWrapper label="Années d'expérience" htmlFor="e3-exp" required error={errors.yearsExperience}>
        <TextInput id="e3-exp" type="number" placeholder="5" value={form.yearsExperience} onChange={(v) => update("yearsExperience", v)} hasError={!!errors.yearsExperience} />
      </FieldWrapper>
      <FieldWrapper label="Spécialités" htmlFor="e3-spec">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SPECIALTIES.map((s) => (
            <CheckOption key={s} label={s} checked={form.specialties.includes(s)} onChange={() => toggleSpecialty(s)} />
          ))}
        </div>
      </FieldWrapper>
      <FieldWrapper label="Présentation" htmlFor="e3-bio" error={errors.bio}
        hint="Minimum 30 caractères. Décrivez votre approche pédagogique.">
        <TextareaInput id="e3-bio" rows={4} placeholder="Ex. : Je propose des leçons adaptées à chaque profil…"
          value={form.bio} onChange={(v) => update("bio", v)} hasError={!!errors.bio} />
      </FieldWrapper>
    </EditShell>
  );
}

function EditStep4({ initial, onSave, onBack }: { initial: Step4Data; onSave: (d: Step4Data) => void; onBack: () => void }) {
  const [form, setForm] = useState<Step4Data>(initial);
  const [errors, setErrors] = useState<Step4Errors>({});
  const [submitted, setSubmitted] = useState(false);

  const revalidate = (next: Step4Data) => { if (submitted) setErrors(validateStep4(next)); };

  const toggleLessonType = (t: string) => setForm((p) => { const n = { ...p, lessonTypes: p.lessonTypes.includes(t) ? p.lessonTypes.filter((x) => x !== t) : [...p.lessonTypes, t] }; revalidate(n); return n; });
  const togglePackage    = (t: string) => setForm((p) => ({ ...p, packages: p.packages.includes(t) ? p.packages.filter((x) => x !== t) : [...p.packages, t] }));

  const handleHourlyRate = (val: string) => setForm((p) => {
    const rate = Number(val);
    const prices = { ...p.durationPrices };
    if (!isNaN(rate) && rate > 0) for (const d of p.durations) if (!p.customizedPrices.includes(d)) prices[d] = suggestPrice(rate, d);
    const n = { ...p, pricePerHour: val, durationPrices: prices };
    revalidate(n); return n;
  });

  const toggleDuration = (id: string) => setForm((p) => {
    if (p.durations.includes(id)) {
      const prices = { ...p.durationPrices }; delete prices[id];
      const n = { ...p, durations: p.durations.filter((d) => d !== id), durationPrices: prices, customizedPrices: p.customizedPrices.filter((d) => d !== id) };
      revalidate(n); return n;
    }
    const rate = Number(p.pricePerHour);
    const prices = { ...p.durationPrices };
    if (!isNaN(rate) && rate > 0) prices[id] = suggestPrice(rate, id);
    const n = { ...p, durations: [...p.durations, id], durationPrices: prices };
    revalidate(n); return n;
  });

  const handleDurPrice = (id: string, val: string) => setForm((p) => {
    const n = { ...p, durationPrices: { ...p.durationPrices, [id]: val }, customizedPrices: p.customizedPrices.includes(id) ? p.customizedPrices : [...p.customizedPrices, id] };
    revalidate(n); return n;
  });

  const handleSave = () => {
    setSubmitted(true);
    const rate = Number(form.pricePerHour);
    const ensured = { ...form.durationPrices };
    if (!isNaN(rate) && rate > 0) for (const d of form.durations) if (!ensured[d]) ensured[d] = suggestPrice(rate, d);
    const effective = { ...form, durationPrices: ensured };
    const errs = validateStep4(effective);
    setErrors(errs);
    if (Object.keys(errs).length === 0) { setForm(effective); onSave(effective); }
  };

  const selectedDurations = DURATIONS.filter((d) => form.durations.includes(d.id));

  return (
    <EditShell title="Services et tarifs" onBack={onBack} onSave={handleSave}>
      <div>
        <p className="text-sm font-semibold text-navy mb-3">Types de leçons <span className="text-red-400">*</span></p>
        {errors.lessonTypes && <p className="text-xs text-red-500 mb-2">{errors.lessonTypes}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {LESSON_TYPES.map((t) => <CheckOption key={t} label={t} checked={form.lessonTypes.includes(t)} onChange={() => toggleLessonType(t)} />)}
        </div>
      </div>
      <FieldWrapper label="Tarif horaire ($ CAD)" htmlFor="e4-rate" required error={errors.pricePerHour}
        hint="Tarif de référence pour 60 min. Min 10 $, max 200 $.">
        <TextInput id="e4-rate" type="number" placeholder="65" value={form.pricePerHour} onChange={handleHourlyRate} hasError={!!errors.pricePerHour} />
      </FieldWrapper>
      <FieldWrapper label="Durées proposées" htmlFor="e4-dur" required error={errors.durations}>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {DURATIONS.map((d) => <ToggleButton key={d.id} label={d.label} selected={form.durations.includes(d.id)} onClick={() => toggleDuration(d.id)} />)}
        </div>
      </FieldWrapper>
      {selectedDurations.length > 0 && (
        <FieldWrapper label="Tarifs par durée" htmlFor="e4-dprices" required error={errors.durationPrices}>
          <div className="flex flex-col gap-3">
            {selectedDurations.map((d) => {
              const val = form.durationPrices[d.id] ?? "";
              const hasErr = submitted && (!val.trim() || isNaN(Number(val)) || Number(val) <= 0);
              return (
                <div key={d.id} className="flex items-center gap-3">
                  <span className="w-16 flex-shrink-0 text-sm font-semibold text-navy">{d.label}</span>
                  <div className="w-28 flex-shrink-0">
                    <TextInput id={`e4-p-${d.id}`} type="number" placeholder="0" value={val} onChange={(v) => handleDurPrice(d.id, v)} hasError={hasErr} />
                  </div>
                  <span className="text-sm text-gray-400">$ CAD</span>
                  {"badge" in d && d.badge && <span className="text-xs text-gray-500">{d.badge}</span>}
                </div>
              );
            })}
          </div>
        </FieldWrapper>
      )}
      <div>
        <p className="text-sm font-semibold text-navy mb-3">Forfaits <span className="text-gray-400 font-normal">(optionnel)</span></p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PACKAGES.map((p) => <CheckOption key={p} label={p} checked={form.packages.includes(p)} onChange={() => togglePackage(p)} />)}
        </div>
      </div>
    </EditShell>
  );
}

function EditStep5({ initial, onSave, onBack }: { initial: Step5Data; onSave: (d: Step5Data) => void; onBack: () => void }) {
  const [form, setForm] = useState<Step5Data>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof Step5Data, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof Step5Data>(k: K, v: Step5Data[K]) =>
    setForm((p) => { const n = { ...p, [k]: v }; if (submitted) setErrors(validateStep5(n)); return n; });

  const handleSave = () => {
    setSubmitted(true);
    const errs = validateStep5(form);
    setErrors(errs);
    if (Object.keys(errs).length === 0) onSave(form);
  };

  return (
    <EditShell title="Véhicule" onBack={onBack} onSave={handleSave}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldWrapper label="Marque" htmlFor="e5-brand" required error={errors.brand}>
          <TextInput id="e5-brand" placeholder="Toyota" value={form.brand} onChange={(v) => update("brand", v)} hasError={!!errors.brand} />
        </FieldWrapper>
        <FieldWrapper label="Modèle" htmlFor="e5-model" required error={errors.model}>
          <TextInput id="e5-model" placeholder="Corolla" value={form.model} onChange={(v) => update("model", v)} hasError={!!errors.model} />
        </FieldWrapper>
        <FieldWrapper label="Année" htmlFor="e5-year" required error={errors.year}>
          <TextInput id="e5-year" type="number" placeholder={String(CURRENT_YEAR)} value={form.year} onChange={(v) => update("year", v)} hasError={!!errors.year} />
        </FieldWrapper>
        <FieldWrapper label="Couleur" htmlFor="e5-color">
          <TextInput id="e5-color" placeholder="Blanc" value={form.color} onChange={(v) => update("color", v)} />
        </FieldWrapper>
      </div>
      <FieldWrapper label="Type de boîte" htmlFor="e5-gearbox" required error={errors.gearbox}>
        <div className="flex gap-3">
          <ToggleButton label="Automatique" selected={form.gearbox === "automatic"} onClick={() => update("gearbox", "automatic")} />
          <ToggleButton label="Manuelle"    selected={form.gearbox === "manual"}    onClick={() => update("gearbox", "manual")} />
        </div>
      </FieldWrapper>
    </EditShell>
  );
}

function EditStep6({ initial, onSave, onBack }: { initial: Step6Data; onSave: (d: Step6Data) => void; onBack: () => void }) {
  const [form, setForm] = useState<Step6Data>(initial);
  const [errors, setErrors] = useState<Step6Errors>({});
  const [submitted, setSubmitted] = useState(false);

  const toggleDay = (key: string) => {
    const next = { ...form, days: form.days.includes(key) ? form.days.filter((d) => d !== key) : [...form.days, key] };
    setForm(next); if (submitted) setErrors(validateStep6(next));
  };
  const toggleSlot = (key: "morning" | "afternoon" | "evening") => {
    const next = { ...form, [key]: !form[key] };
    setForm(next); if (submitted) setErrors(validateStep6(next));
  };

  const handleSave = () => {
    setSubmitted(true);
    const errs = validateStep6(form);
    setErrors(errs);
    if (Object.keys(errs).length === 0) onSave(form);
  };

  return (
    <EditShell title="Disponibilités" onBack={onBack} onSave={handleSave}>
      <FieldWrapper label="Jours disponibles" htmlFor="e6-days" required error={errors.days}>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {DAYS.map(({ key, short }) => (
            <ToggleButton key={key} label={short} selected={form.days.includes(key)} onClick={() => toggleDay(key)} />
          ))}
        </div>
      </FieldWrapper>
      <FieldWrapper label="Plages horaires" htmlFor="e6-slots" required error={errors.slots}>
        <div className="flex flex-col gap-2">
          {SLOTS.map(({ key, label, desc }) => (
            <label key={key} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form[key] ? "border-navy bg-navy/5" : "border-gray-100 bg-white hover:border-gray-200"}`}>
              <input type="checkbox" checked={form[key]} onChange={() => toggleSlot(key)} className="sr-only" />
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${form[key] ? "bg-navy border-navy" : "border-gray-300"}`}>
                {form[key] && <IconCheckSmall />}
              </div>
              <span className={`text-sm font-medium ${form[key] ? "text-navy" : "text-gray-700"}`}>{label}</span>
              <span className="text-xs text-gray-400 ml-auto">{desc}</span>
            </label>
          ))}
        </div>
      </FieldWrapper>
    </EditShell>
  );
}

/* ═══════════════════════════════════════════════════════════
   PROFILE VIEW COMPONENTS
═══════════════════════════════════════════════════════════ */

function SectionCard({
  title, onEdit, children,
}: {
  title: string; onEdit: () => void; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{title}</h3>
        <button type="button" onClick={onEdit}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy border border-navy/20 px-3 py-1.5 rounded-lg hover:bg-navy/5 transition-colors">
          <IconEdit /> Modifier
        </button>
      </div>
      <dl className="flex flex-col gap-2">{children}</dl>
    </div>
  );
}

function PRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{label}</dt>
      <dd className="text-sm font-medium text-navy text-right">{value}</dd>
    </div>
  );
}

function TagRow({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((t) => <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-surface text-navy font-medium">{t}</span>)}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD VIEW
═══════════════════════════════════════════════════════════ */

function DashboardView({
  session, account, photoUrl, onLogout, onPhotoChange,
}: {
  session: AuthSession; account: StoredAccount; photoUrl: string | null;
  onLogout: () => void; onPhotoChange: (url: string | null) => void;
}) {
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [currentAccount, setCurrentAccount] = useState<StoredAccount>(account);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(photoUrl);
  const [currentSession, setCurrentSession] = useState<AuthSession>(session);
  const [saveError, setSaveError] = useState("");

  const profile = currentAccount.profile;

  /**
   * Enregistre une section modifiée du profil.
   *
   * Flux : formulaire → Neon (PUT /api/instructor/profile) → confirmation
   * → mise à jour de l'interface.
   *
   * Neon est la source persistante principale — l'interface n'est mise à
   * jour qu'après confirmation Neon. En cas d'échec : rien n'est mis à
   * jour, le formulaire reste ouvert avec les données saisies, un message
   * générique s'affiche.
   *
   * Fonctionne même si dp_account n'existe pas en localStorage : l'état
   * React est mis à jour directement à partir des données confirmées par
   * Neon (newProfile), jamais en relisant dp_account.
   */
  const handleSave = async (section: Section, data: unknown, newPhoto?: string | null) => {
    if (!profile) return;
    const newProfile: ProfileData = { ...profile, [section]: data };

    setSaveError("");

    let succeeded = false;
    try {
      const res = await fetch("/api/instructor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProfile),
      });
      const responseData = await res.json().catch(() => null) as { ok?: boolean } | null;
      succeeded = res.ok && !!responseData?.ok;
    } catch (err) {
      console.error("[instructor/account] Échec de l'enregistrement du profil:", err);
    }

    if (!succeeded) {
      setSaveError("Impossible d'enregistrer vos modifications. Veuillez réessayer.");
      return; // Formulaire conservé ouvert, données saisies intactes.
    }

    // Interface mise à jour à partir des données confirmées par Neon —
    // ne dépend pas de la présence de dp_account/dp_session.
    setCurrentAccount((prev) => ({ ...prev, profile: newProfile }));
    const s1 = newProfile.step1;
    setCurrentSession((prev) => ({
      ...prev,
      firstName: s1.firstName.trim() || prev.firstName,
      lastName:  s1.lastName.trim()  || prev.lastName,
      email:     s1.email.trim()     || prev.email,
    }));
    if (newPhoto !== undefined) { setCurrentPhoto(newPhoto); onPhotoChange(newPhoto); }
    setEditingSection(null);
  };

  // ── Header (always visible) ──────────────────────────
  const header = (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-surface border-2 border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {currentPhoto
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={currentPhoto} alt="Photo de profil" className="w-full h-full object-cover" />
            : <IconUserPlaceholder />}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-xl font-bold text-navy">
              {currentSession.firstName} {currentSession.lastName}
            </h1>
            {profile && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-dp/10 text-green-dp">
                Profil actif
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">{currentSession.email}</p>
        </div>
      </div>
      <button type="button" onClick={onLogout}
        className="self-start sm:self-auto text-sm font-medium text-gray-500 hover:text-red-500 transition-colors px-3 py-2 rounded-xl border border-gray-200 hover:border-red-200">
        Se déconnecter
      </button>
    </div>
  );

  // ── No profile yet ───────────────────────────────────
  if (!profile) {
    return (
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 lg:px-0 py-10">
        {header}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Votre compte est créé. Complétez votre profil pour apparaître sur la plateforme.
          </p>
          <Link href="/instructor/register"
            className="inline-flex items-center gap-2 bg-navy text-white text-sm font-semibold px-8 py-3 rounded-xl hover:bg-navy-dark transition-colors shadow-sm">
            Compléter mon profil <IconArrowRight />
          </Link>
        </div>
      </div>
    );
  }

  // ── Edit form active ─────────────────────────────────
  if (editingSection !== null) {
    const onBack = () => { setSaveError(""); setEditingSection(null); };
    return (
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 lg:px-0 py-10">
        {header}
        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 leading-snug mb-4">
            {saveError}
          </div>
        )}
        {editingSection === "step1" && (
          <EditStep1
            initial={profile.step1} initialPhoto={currentPhoto}
            onSave={(d, p) => handleSave("step1", d, p)} onBack={onBack} />
        )}
        {editingSection === "step2" && (
          <EditStep2 initial={profile.step2} onSave={(d) => handleSave("step2", d)} onBack={onBack} />
        )}
        {editingSection === "step3" && (
          <EditStep3 initial={profile.step3} onSave={(d) => handleSave("step3", d)} onBack={onBack} />
        )}
        {editingSection === "step4" && (
          <EditStep4 initial={profile.step4} onSave={(d) => handleSave("step4", d)} onBack={onBack} />
        )}
        {editingSection === "step5" && (
          <EditStep5 initial={profile.step5} onSave={(d) => handleSave("step5", d)} onBack={onBack} />
        )}
        {editingSection === "step6" && (
          <EditStep6 initial={profile.step6} onSave={(d) => handleSave("step6", d)} onBack={onBack} />
        )}
      </div>
    );
  }

  // ── Profile view ─────────────────────────────────────
  const gearboxLabel = profile.step5.gearbox === "manual" ? "Boîte manuelle"
    : profile.step5.gearbox === "automatic" ? "Boîte automatique" : "";

  const dayLabels: Record<string, string> = {
    lun: "Lundi", mar: "Mardi", mer: "Mercredi",
    jeu: "Jeudi", ven: "Vendredi", sam: "Samedi", dim: "Dimanche",
  };

  const availabilityLabel = [
    profile.step6.morning && "Matin",
    profile.step6.afternoon && "Après-midi",
    profile.step6.evening && "Soirée",
  ].filter(Boolean).join(", ") || "—";

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-6 lg:px-0 py-10">
      {header}
      <div className="flex flex-col gap-4">

        <SectionCard title="Informations personnelles" onEdit={() => setEditingSection("step1")}>
          <PRow label="Prénom"     value={profile.step1.firstName} />
          <PRow label="Nom"        value={profile.step1.lastName} />
          <PRow label="Courriel"   value={profile.step1.email} />
          <PRow label="Téléphone"  value={profile.step1.phone} />
          {profile.step1.birthDate && <PRow label="Naissance" value={profile.step1.birthDate} />}
        </SectionCard>

        <SectionCard title="Adresse et zone d'activité" onEdit={() => setEditingSection("step2")}>
          <PRow label="Adresse"    value={[profile.step2.street, profile.step2.complement].filter(Boolean).join(", ")} />
          <PRow label="Ville"      value={profile.step2.city} />
          <PRow label="Code postal" value={profile.step2.postalCode} />
          <PRow label="Province"   value={profile.step2.province} />
          {profile.step2.activityRadius && <PRow label="Zone d'activité" value={`${profile.step2.activityRadius} km`} />}
        </SectionCard>

        <SectionCard title="Profil professionnel" onEdit={() => setEditingSection("step3")}>
          <PRow label="Statut"         value={profile.step3.status} />
          <PRow label="Permis / licence" value={profile.step3.certificationNumber} />
          {profile.step3.yearsExperience && (
            <PRow label="Expérience" value={`${profile.step3.yearsExperience} an${Number(profile.step3.yearsExperience) > 1 ? "s" : ""}`} />
          )}
          <TagRow label="Spécialités" items={profile.step3.specialties} />
          {profile.step3.bio && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400">Présentation</span>
              <p className="text-sm text-navy leading-relaxed">{profile.step3.bio}</p>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Services et tarifs" onEdit={() => setEditingSection("step4")}>
          {profile.step4.pricePerHour && <PRow label="Tarif horaire" value={`${profile.step4.pricePerHour} $/h`} />}
          <TagRow label="Types de leçons" items={profile.step4.lessonTypes} />
          {profile.step4.durations.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-gray-400">Durées proposées</span>
              <div className="flex flex-wrap gap-1.5">
                {profile.step4.durations.map((d) => (
                  <span key={d} className="text-xs px-2.5 py-1 rounded-full bg-surface text-navy font-medium">
                    {d}{profile.step4.durationPrices[d] ? ` — ${profile.step4.durationPrices[d]} $` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}
          <TagRow label="Forfaits" items={profile.step4.packages} />
        </SectionCard>

        <SectionCard title="Véhicule" onEdit={() => setEditingSection("step5")}>
          <PRow label="Marque"  value={profile.step5.brand} />
          <PRow label="Modèle"  value={profile.step5.model} />
          <PRow label="Année"   value={profile.step5.year} />
          <PRow label="Boîte"   value={gearboxLabel} />
          <PRow label="Couleur" value={profile.step5.color} />
        </SectionCard>

        <SectionCard title="Disponibilités" onEdit={() => setEditingSection("step6")}>
          {profile.step6.days.length > 0 && (
            <PRow label="Jours" value={profile.step6.days.map((d) => dayLabels[d] ?? d).join(", ")} />
          )}
          <PRow label="Plages horaires" value={availabilityLabel} />
        </SectionCard>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ACCOUNT CREATION FORM (unchanged for new users)
═══════════════════════════════════════════════════════════ */

const ALL_STEPS = [
  "Compte", "Infos personnelles", "Adresse", "Profil pro",
  "Services", "Véhicule", "Disponibilités", "Vérification",
] as const;

function CreationStepProgress() {
  return (
    <div className="w-full mb-8">
      <div className="flex sm:hidden items-center justify-between mb-2">
        <span className="text-xs font-semibold text-navy">Étape 1 sur {ALL_STEPS.length}</span>
        <span className="text-xs text-gray-400">{ALL_STEPS[0]}</span>
      </div>
      <div className="sm:hidden w-full bg-gray-100 rounded-full h-1.5">
        <div className="bg-navy h-1.5 rounded-full" style={{ width: `${(1 / ALL_STEPS.length) * 100}%` }} />
      </div>
      <ol className="hidden sm:flex items-start w-full">
        {ALL_STEPS.map((label, i) => {
          const active = i === 0;
          const isLast = i === ALL_STEPS.length - 1;
          return (
            <li key={label} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${active ? "bg-navy border-navy text-white" : "bg-white border-gray-200 text-gray-300"}`}>
                  {active ? <IconCheckSmall /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                </div>
                <span className={`mt-1.5 text-[10px] font-medium text-center leading-tight px-0.5 ${active ? "text-navy" : "text-gray-400"}`}
                  style={{ maxWidth: "68px" }}>{label}</span>
              </div>
              {!isLast && <div className="h-0.5 flex-1 mx-1 mb-5 rounded-full bg-gray-200" />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const baseCls = (hasError?: boolean) =>
  `w-full rounded-xl border px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all
   focus:ring-2 focus:ring-navy/20 focus:border-navy
   ${hasError ? "border-red-300 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"}`;

function CreationTextInput({ id, type = "text", placeholder, value, onChange, hasError, autoComplete }: {
  id: string; type?: string; placeholder?: string; value: string;
  onChange: (v: string) => void; hasError?: boolean; autoComplete?: string;
}) {
  return (
    <input id={id} name={id} type={type} placeholder={placeholder} value={value}
      autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} className={baseCls(hasError)} />
  );
}

function PasswordInput({ id, value, onChange, hasError, autoComplete, placeholder }: {
  id: string; value: string; onChange: (v: string) => void;
  hasError?: boolean; autoComplete?: string; placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input id={id} name={id} type={visible ? "text" : "password"} placeholder={placeholder}
        value={value} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)}
        className={`${baseCls(hasError)} pr-11`} />
      <button type="button" onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy transition-colors p-1"
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
        <IconEye open={visible} />
      </button>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = (password.length >= 8 ? 1 : 0) + (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) + (/[^A-Za-z0-9]/.test(password) ? 1 : 0);
  const levels = [
    { label: "Très faible", color: "bg-red-400", bars: 1 },
    { label: "Faible", color: "bg-orange-400", bars: 2 },
    { label: "Moyen", color: "bg-amber-400", bars: 3 },
    { label: "Fort", color: "bg-green-dp", bars: 4 },
  ];
  const level = levels[Math.max(0, Math.min(score - 1, 3))];
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className={`h-1 flex-1 rounded-full transition-all ${n <= level.bars ? level.color : "bg-gray-100"}`} />
        ))}
      </div>
      <span className="text-xs text-gray-400 w-16 text-right">{level.label}</span>
    </div>
  );
}

type CreationFormState = Step0Data & { password: string; confirmPassword: string; acceptedTerms: boolean };
type CreationErrors = Partial<Record<keyof CreationFormState, string>>;

function validateCreation(f: CreationFormState): CreationErrors {
  const e: CreationErrors = {};
  if (!f.firstName.trim())  e.firstName = "Le prénom est obligatoire.";
  if (!f.lastName.trim())   e.lastName  = "Le nom est obligatoire.";
  if (!f.email.trim())      e.email = "L'adresse e-mail est obligatoire.";
  else if (!EMAIL_RE.test(f.email.trim())) e.email = "Format d'e-mail invalide.";
  if (!f.phone.trim())      e.phone = "Le téléphone est obligatoire.";
  else if (!PHONE_RE.test(f.phone.trim())) e.phone = "Numéro invalide.";
  if (!f.password)          e.password = "Le mot de passe est obligatoire.";
  else if (f.password.length < 8) e.password = "Minimum 8 caractères.";
  if (!f.confirmPassword)   e.confirmPassword = "Confirmez le mot de passe.";
  else if (f.confirmPassword !== f.password) e.confirmPassword = "Les mots de passe ne correspondent pas.";
  if (!f.acceptedTerms)     e.acceptedTerms = "Vous devez accepter les conditions d'utilisation.";
  return e;
}

/* ═══════════════════════════════════════════════════════════
   CREATION FIELD WRAPPER (local, avoids id collision)
═══════════════════════════════════════════════════════════ */

function CreationFieldWrapper({ label, htmlFor, required, error, children }: {
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

/* ═══════════════════════════════════════════════════════════
   CHARGEMENT DU PROFIL — Neon, source unique (étape 13C)
═══════════════════════════════════════════════════════════ */

/**
 * Construit l'objet StoredAccount attendu par DashboardView à partir d'un
 * profil lu sur Neon. DashboardView ne lit jamais les champs de tête
 * (email/passwordHash/firstName/lastName/createdAt) — seul `.profile`
 * est affiché/édité — donc ces champs sont systématiquement dérivés de la
 * session serveur (currentUser), jamais de dp_account.
 *
 * C'est désormais le SEUL moyen de peupler `account` pour un utilisateur
 * connecté : plus aucun profil n'est reconstruit depuis localStorage.
 */
function buildAccountFromNeonProfile(
  neonProfile: ProfileData,
  fallbackSession: { email: string; firstName: string; lastName: string },
): StoredAccount {
  return {
    email: fallbackSession.email,
    passwordHash: "", // jamais lu ni affiché par DashboardView
    firstName: fallbackSession.firstName,
    lastName: fallbackSession.lastName,
    createdAt: new Date().toISOString(),
    profile: neonProfile,
  };
}

/* ═══════════════════════════════════════════════════════════
   ÉTAT SANS PROFIL — utilisateur connecté, aucun profil Neon affichable

   Remplace l'ancien repli sur dp_account.profile (étape 13C).

   Deux situations distinctes, jamais confondues :
     • failed = false — Neon a répondu qu'aucun profil n'existe encore
       pour ce compte. Le profil reste à compléter.
     • failed = true  — le profil n'a pas pu être lu (réseau, 401, 500).
       On n'affirme surtout pas qu'il est absent : on ne sait pas.

   Dans les deux cas : aucune donnée n'est inventée ni reconstruite depuis
   localStorage, et le formulaire de création de compte n'est jamais
   proposé — le compte, lui, existe bien (session serveur valide).
═══════════════════════════════════════════════════════════ */

function ProfileUnavailable({
  failed, onLogout,
}: {
  failed: boolean; onLogout: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">

        <h1 className="text-2xl font-bold text-navy mb-3">
          {failed ? "Profil momentanément indisponible" : "Profil non complété"}
        </h1>

        <p className="text-sm text-gray-400 leading-relaxed mb-8">
          {failed
            ? "Nous n'avons pas pu charger votre profil pour le moment. Aucune donnée n'a été perdue — veuillez réessayer dans un instant."
            : "Votre compte est bien créé, mais votre profil de moniteur n'a pas encore été enregistré. Complétez-le pour accéder à votre tableau de bord."}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {failed ? (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto inline-flex items-center justify-center bg-navy text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-navy-dark transition-colors shadow-sm"
            >
              Réessayer
            </button>
          ) : (
            <Link
              href="/instructor/register"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-navy text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-navy-dark transition-colors shadow-sm"
            >
              Compléter mon profil
            </Link>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="w-full sm:w-auto inline-flex items-center justify-center text-sm font-medium text-gray-500 hover:text-navy transition-colors px-6 py-3"
          >
            Se déconnecter
          </button>
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */

/**
 * Composant client — logique et interface inchangées.
 * Rendu par app/instructor/account/page.tsx (Server Component) après
 * la vérification de rôle côté serveur (voir getCurrentUser()).
 *
 * `currentUser` vient du serveur (session Neon via cookie HttpOnly) :
 * c'est lui — et non plus sessionStorage — qui détermine si le dashboard
 * doit s'afficher. `null` = visiteur non connecté → formulaire public
 * de création de compte (comportement inchangé).
 */
export default function InstructorAccountClient({
  currentUser,
}: {
  currentUser: PublicUser | null;
}) {
  const router = useRouter();

  // Authentification décidée par le serveur — plus par sessionStorage.
  const isLoggedIn = currentUser !== null;
  const session: AuthSession | null = currentUser ? {
    email:     currentUser.email,
    firstName: currentUser.firstName,
    lastName:  currentUser.lastName,
    role:      currentUser.role,
  } : null;

  const [account, setAccount] = useState<StoredAccount | null>(null);
  // Photo — always null on SSR, loaded client-side only
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  // Le profil vient uniquement de Neon (étape 13C) — plus aucun repli
  // localStorage ici. Seule la photo reste lue en local (hors scope).
  const [accountLoaded, setAccountLoaded] = useState(false);
  // true = le chargement Neon a échoué (réseau/serveur). Distinct de
  // « aucun profil » : on ne doit pas annoncer un profil à compléter
  // alors qu'on n'a simplement pas réussi à le lire.
  const [loadFailed, setLoadFailed] = useState(false);

  // Creation form state
  const [form, setForm] = useState<CreationFormState>({ ...DEFAULTS.step0, password: "", confirmPassword: "", acceptedTerms: false });
  const [errors, setErrors] = useState<CreationErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [creating, setCreating] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!isLoggedIn) { setAccountLoaded(true); return; }

    // Photo — hors scope de cette étape, reste localStorage comme avant.
    setPhotoUrl(getProfilePhoto());

    let cancelled = false;

    (async () => {
      // Neon est la seule source de lecture du profil (étape 13C) :
      // dp_account.profile n'est plus consulté ici. Un profil absent reste
      // absent — jamais reconstruit depuis localStorage, jamais complété
      // par des valeurs par défaut — et l'interface l'annonce explicitement.
      try {
        const res = await fetch("/api/instructor/profile");
        const data = await res.json().catch(() => null) as
          { ok?: boolean; profile?: ProfileData | null } | null;

        if (cancelled) return;

        if (res.ok && data?.ok && data.profile && currentUser) {
          setAccount(buildAccountFromNeonProfile(data.profile, currentUser));
        } else if (res.ok && data?.ok) {
          // Réponse valide, mais aucun profil en base (profile: null) —
          // état vide assumé, ce n'est pas une erreur.
          setAccount(null);
        } else {
          // Réponse d'erreur (401, 500…) : on ne peut rien affirmer sur
          // l'existence du profil — état d'erreur, surtout pas état vide.
          console.error(
            "[instructor/account] Réponse inattendue au chargement du profil Neon — statut:",
            res.status,
          );
          setAccount(null);
          setLoadFailed(true);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[instructor/account] Échec du chargement du profil Neon:", err);
          setAccount(null);
          setLoadFailed(true);
        }
      } finally {
        if (!cancelled) setAccountLoaded(true);
      }
    })();

    return () => { cancelled = true; };
    // currentUser (prop serveur) est référentiellement stable entre les
    // rendus de ce composant — pas de re-déclenchement en boucle.
  }, [isLoggedIn, currentUser]);

  const update = <K extends keyof CreationFormState>(key: K, value: CreationFormState[K]) => {
    setForm((prev) => { const next = { ...prev, [key]: value }; if (submitted) setErrors(validateCreation(next)); return next; });
  };

  const handleContinue = async () => {
    setSubmitted(true);
    const errs = validateCreation(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setCreating(true);
    setServerError("");
    try {
      // 1. Créer l'utilisateur dans Neon — hash calculé côté serveur
      const res  = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:     form.email,
          password:  form.password,
          firstName: form.firstName,
          lastName:  form.lastName,
        }),
      });
      const data = await res.json() as { ok: boolean; error?: string };

      if (!data.ok) {
        if (data.error === "email_exists") {
          setErrors((e) => ({ ...e, email: "Un compte existe déjà avec cette adresse e-mail." }));
        } else {
          setServerError("Une erreur est survenue lors de la création du compte. Veuillez réessayer.");
        }
        return;
      }

      // 2. Créer le compte local pour compatibilité avec le login actuel
      //    ⚠️  TEMPORAIRE — sera supprimé lors de la migration du login vers Neon
      await createDraftAccount(form.email, form.password, form.firstName, form.lastName);
      saveStep<Step0Data>(0, { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone });
      saveStep(1, { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, birthDate: "" });
      router.push("/instructor/register");
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => { await logout(); router.replace("/login"); };

  return (
    <main className="flex min-h-screen flex-col bg-surface">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 flex items-center justify-between h-16">
          <Link href="/" className="flex-shrink-0 flex items-center">
            <Image src="/brand/logo-horizontal.png" alt="Drive-Path" width={160} height={44} className="h-9 w-auto object-contain" priority />
          </Link>
          {!isLoggedIn && (
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-navy transition-colors px-2 py-1">
              Connexion
            </Link>
          )}
        </div>
      </header>

      {/* Content */}
      {isLoggedIn && !accountLoaded ? (
        /* Loading — profil en cours de lecture depuis Neon */
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
        </div>

      ) : isLoggedIn && session && account ? (
        /* Dashboard */
        <DashboardView
          session={session}
          account={account}
          photoUrl={photoUrl}
          onLogout={handleLogout}
          onPhotoChange={setPhotoUrl}
        />

      ) : isLoggedIn && session ? (
        /* Connecté, mais aucun profil Neon affichable. Jamais le
           formulaire de création de compte : le compte existe déjà. */
        <ProfileUnavailable failed={loadFailed} onLogout={handleLogout} />

      ) : (
        /* Account creation form */
        <div className="flex-1 max-w-2xl mx-auto w-full px-6 lg:px-0 py-10">
          <div className="mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-navy mb-2">Créez votre compte moniteur</h1>
            <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
              Commencez par vos informations de connexion. Vous compléterez votre profil à l&apos;étape suivante.
            </p>
          </div>
          <CreationStepProgress />
          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 leading-snug mb-2">
              {serverError}
            </div>
          )}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <h2 className="text-base font-bold text-navy mb-6">Informations de compte</h2>
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CreationFieldWrapper label="Prénom" htmlFor="c-firstName" required error={errors.firstName}>
                  <CreationTextInput id="c-firstName" placeholder="Jean" value={form.firstName}
                    onChange={(v) => update("firstName", v)} hasError={!!errors.firstName} autoComplete="given-name" />
                </CreationFieldWrapper>
                <CreationFieldWrapper label="Nom" htmlFor="c-lastName" required error={errors.lastName}>
                  <CreationTextInput id="c-lastName" placeholder="Dupont" value={form.lastName}
                    onChange={(v) => update("lastName", v)} hasError={!!errors.lastName} autoComplete="family-name" />
                </CreationFieldWrapper>
              </div>
              <CreationFieldWrapper label="Adresse e-mail" htmlFor="c-email" required error={errors.email}>
                <CreationTextInput id="c-email" type="email" placeholder="jean.dupont@exemple.ca"
                  value={form.email} onChange={(v) => update("email", v)} hasError={!!errors.email} autoComplete="email" />
              </CreationFieldWrapper>
              <CreationFieldWrapper label="Téléphone" htmlFor="c-phone" required error={errors.phone}>
                <CreationTextInput id="c-phone" type="tel" placeholder="506 123-4567"
                  value={form.phone} onChange={(v) => update("phone", v)} hasError={!!errors.phone} autoComplete="tel" />
              </CreationFieldWrapper>
              <div className="border-t border-gray-100 pt-1" />
              <CreationFieldWrapper label="Mot de passe" htmlFor="c-password" required error={errors.password}>
                <PasswordInput id="c-password" placeholder="8 caractères minimum" value={form.password}
                  onChange={(v) => update("password", v)} hasError={!!errors.password} autoComplete="new-password" />
                <PasswordStrength password={form.password} />
              </CreationFieldWrapper>
              <CreationFieldWrapper label="Confirmer le mot de passe" htmlFor="c-confirm" required error={errors.confirmPassword}>
                <PasswordInput id="c-confirm" placeholder="Répétez le mot de passe" value={form.confirmPassword}
                  onChange={(v) => update("confirmPassword", v)} hasError={!!errors.confirmPassword} autoComplete="new-password" />
              </CreationFieldWrapper>
              <div className="border-t border-gray-100 pt-1" />
              <div className="flex flex-col gap-1.5">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" checked={form.acceptedTerms}
                    onChange={(e) => update("acceptedTerms", e.target.checked)} className="sr-only" />
                  <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${form.acceptedTerms ? "bg-navy border-navy" : errors.acceptedTerms ? "border-red-400" : "border-gray-300"}`}>
                    {form.acceptedTerms && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                  </div>
                  <span className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors">
                    J&apos;accepte les{" "}
                    <Link href="/terms" className="text-navy font-medium hover:underline underline-offset-2">conditions d&apos;utilisation</Link>{" "}
                    et la politique de confidentialité de Drive-Path.
                  </span>
                </label>
                {errors.acceptedTerms && <p className="text-xs text-red-500 ml-7">{errors.acceptedTerms}</p>}
              </div>
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 mt-6">
            <Link href="/instructor"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-navy transition-colors px-2 py-2">
              <IconArrowLeft /> Retour
            </Link>
            <button type="button" onClick={handleContinue} disabled={creating}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-navy text-white text-sm font-semibold px-8 py-3 rounded-xl hover:bg-navy-dark transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
              {creating ? (<><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>Création…</>) : (<>Continuer <IconArrowRight /></>)}
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-5">
            Les champs marqués <span className="text-red-400">*</span> sont obligatoires.
          </p>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 px-6 py-8 mt-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-3">
            <Image src="/brand/logo-horizontal.png" alt="Drive-Path" width={100} height={28} className="h-6 w-auto object-contain opacity-50" />
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
