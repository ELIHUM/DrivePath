"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PageShell, StepProgress, FormCard, FieldWrapper,
  TextInput, SelectInput, TextareaInput, CheckOption,
  NavButtons, RequiredNotice,
} from "../_shared";
import { saveStep, loadStep, DEFAULTS } from "../_store";
import type { Step3Data } from "../_store";

/* ═══════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════ */

const STATUSES = [
  "Moniteur indépendant",
  "Auto-école",
  "Moniteur salarié",
  "Autre",
] as const;

const SPECIALTIES = [
  "Permis B",
  "Conduite accompagnée",
  "Conduite supervisée",
  "Perfectionnement",
  "Reprise de confiance",
  "Conduite après obtention du permis",
] as const;

/* ═══════════════════════════════════════════════════════════
   PHOTO PICKER
═══════════════════════════════════════════════════════════ */

function IconCamera() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6M9 6V4h6v2" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function PhotoPicker({
  photoUrl, onSelect, onRemove,
}: {
  photoUrl: string | null;
  onSelect: (url: string) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onSelect(URL.createObjectURL(file));
    e.target.value = "";
  }, [onSelect]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-2xl bg-surface border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="Aperçu de la photo de profil" className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-300"><IconUser /></span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 text-sm font-medium text-navy border border-gray-200 px-4 py-2 rounded-xl hover:border-navy/30 hover:bg-navy/5 transition-colors"
          >
            <IconCamera />
            {photoUrl ? "Changer la photo" : "Sélectionner une photo"}
          </button>
          {photoUrl && (
            <button
              type="button" onClick={onRemove}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-600 transition-colors px-1"
            >
              <IconTrash /> Supprimer
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">
        Formats acceptés : JPG, PNG, WEBP. La photo sera visible sur votre profil public.
        Cette étape est facultative.
      </p>
      <input
        ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
        onChange={handleFile} className="sr-only"
        aria-label="Sélectionner une photo de profil"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VALIDATION
═══════════════════════════════════════════════════════════ */

type Errors = Partial<Record<keyof Step3Data, string>>;

function validate(data: Step3Data): Errors {
  const errors: Errors = {};
  if (!data.status)
    errors.status = "Veuillez sélectionner votre statut professionnel.";
  if (!data.certificationNumber.trim())
    errors.certificationNumber = "Le numéro d'agrément est obligatoire.";
  if (!data.yearsExperience.trim()) {
    errors.yearsExperience = "L'expérience est obligatoire.";
  } else {
    const n = Number(data.yearsExperience);
    if (isNaN(n) || n < 0 || n > 60)
      errors.yearsExperience = "Veuillez saisir un nombre valide (0–60).";
  }
  if (data.specialties.length === 0)
    errors.specialties = "Sélectionnez au moins une spécialité.";
  if (!data.bio.trim())
    errors.bio = "La présentation est obligatoire.";
  else if (data.bio.trim().length < 30)
    errors.bio = "La présentation doit contenir au moins 30 caractères.";
  return errors;
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */

type PageState = Step3Data & { photoUrl: string | null };

export default function RegisterStep3() {
  const router = useRouter();

  const [form, setForm] = useState<PageState>(() => ({
    ...loadStep<Step3Data>(3, DEFAULTS.step3),
    photoUrl: null,
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof PageState>(key: K, value: PageState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (submitted && key !== "photoUrl") setErrors(validate(next));
      return next;
    });
  };

  const toggleSpecialty = (label: string) => {
    update("specialties",
      form.specialties.includes(label)
        ? form.specialties.filter((s) => s !== label)
        : [...form.specialties, label]
    );
  };

  const handleContinue = () => {
    setSubmitted(true);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      const { photoUrl: _, ...persistable } = form;
      void _;
      saveStep<Step3Data>(3, persistable);
      router.push("/instructor/register/step-4");
    }
  };

  return (
    <PageShell>
      <div className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy mb-2">
          Votre profil professionnel
        </h1>
        <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
          Présentez votre expérience et votre profil pour permettre aux élèves de mieux vous connaître.
        </p>
      </div>

      <StepProgress currentStep={2} />

      <FormCard title="Profil professionnel">

        {/* Statut */}
        <FieldWrapper label="Statut professionnel" htmlFor="status" required error={errors.status}>
          <SelectInput
            id="status" value={form.status}
            onChange={(v) => update("status", v)}
            hasError={!!errors.status}
          >
            <option value="">Sélectionnez votre statut…</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </SelectInput>
        </FieldWrapper>

        {/* Agrément */}
        <FieldWrapper
          label="Numéro de permis / licence de moniteur"
          htmlFor="certificationNumber" required
          error={errors.certificationNumber}
          hint="Numéro délivré par l'autorité compétente de votre province. Les exigences peuvent varier selon la province."
        >
          <TextInput
            id="certificationNumber"
            placeholder="Ex : NB-2023-00123"
            value={form.certificationNumber}
            onChange={(v) => update("certificationNumber", v)}
            hasError={!!errors.certificationNumber}
          />
        </FieldWrapper>

        {/* Expérience */}
        <FieldWrapper label="Années d'expérience" htmlFor="yearsExperience" required
          error={errors.yearsExperience}>
          <TextInput
            id="yearsExperience" type="number" placeholder="5"
            value={form.yearsExperience}
            onChange={(v) => update("yearsExperience", v)}
            hasError={!!errors.yearsExperience}
          />
        </FieldWrapper>

        {/* Spécialités */}
        <FieldWrapper label="Spécialités" htmlFor="specialties" required error={errors.specialties}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SPECIALTIES.map((s) => (
              <CheckOption
                key={s} label={s}
                checked={form.specialties.includes(s)}
                onChange={() => toggleSpecialty(s)}
              />
            ))}
          </div>
        </FieldWrapper>

        {/* Présentation */}
        <FieldWrapper
          label="Présentation"
          htmlFor="bio" required
          error={errors.bio}
          hint={`${form.bio.length} caractère${form.bio.length !== 1 ? "s" : ""} — minimum 30`}
        >
          <TextareaInput
            id="bio" rows={5}
            placeholder="Présentez votre expérience, votre approche pédagogique et ce qui vous distingue…"
            value={form.bio}
            onChange={(v) => update("bio", v)}
            hasError={!!errors.bio}
          />
        </FieldWrapper>

        <div className="border-t border-gray-100 pt-1" />

        {/* Photo */}
        <FieldWrapper label="Photo de profil" htmlFor="photo">
          <PhotoPicker
            photoUrl={form.photoUrl}
            onSelect={(url) => update("photoUrl", url)}
            onRemove={() => update("photoUrl", null)}
          />
        </FieldWrapper>

      </FormCard>

      <NavButtons backHref="/instructor/register/step-2" onContinue={handleContinue} />
      <RequiredNotice />
    </PageShell>
  );
}
