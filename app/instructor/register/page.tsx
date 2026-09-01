"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PageShell, StepProgress, FormCard, FieldWrapper,
  TextInput, NavButtons, RequiredNotice,
} from "./_shared";
import { saveStep, loadStep, DEFAULTS } from "./_store";
import type { Step1Data } from "./_store";
import { saveProfilePhoto, clearProfilePhoto } from "@/lib/auth";

/* ═══════════════════════════════════════════════════════════
   ICONS (step-specific)
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

/* ═══════════════════════════════════════════════════════════
   PHOTO PICKER
═══════════════════════════════════════════════════════════ */

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
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) onSelect(dataUrl);
    };
    reader.readAsDataURL(file);
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
        Formats acceptés : JPG, PNG, WEBP. Taille recommandée : 400 × 400 px.
        La photo sera visible sur votre profil public.
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

type FormData = Step1Data & { photoUrl: string | null };
type Errors = Partial<Record<keyof Step1Data, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+?\d[\d\s.\-()]{7,}\d)$/;

function validate(data: FormData): Errors {
  const errors: Errors = {};
  if (!data.firstName.trim()) errors.firstName = "Le prénom est obligatoire.";
  if (!data.lastName.trim())  errors.lastName  = "Le nom est obligatoire.";
  if (!data.email.trim())
    errors.email = "L'adresse courriel est obligatoire.";
  else if (!EMAIL_RE.test(data.email.trim()))
    errors.email = "L'adresse courriel n'est pas valide.";
  if (!data.phone.trim())
    errors.phone = "Le numéro de téléphone est obligatoire.";
  else if (!PHONE_RE.test(data.phone.trim()))
    errors.phone = "Le numéro de téléphone n'est pas valide.";
  if (!data.birthDate) {
    errors.birthDate = "La date de naissance est obligatoire.";
  } else {
    const birth = new Date(data.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear() -
      (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
    if (isNaN(birth.getTime())) errors.birthDate = "La date n'est pas valide.";
    else if (age < 18) errors.birthDate = "Vous devez avoir au moins 18 ans.";
    else if (age > 100) errors.birthDate = "Veuillez vérifier la date saisie.";
  }
  return errors;
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */

export default function InstructorRegisterStep1() {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    ...DEFAULTS.step1,
    photoUrl: null,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setForm({ ...loadStep<Step1Data>(1, DEFAULTS.step1), photoUrl: null });
  }, []);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (submitted && key !== "photoUrl") setErrors(validate(next));
      return next;
    });
  };

  const handleContinue = () => {
    setSubmitted(true);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      const { photoUrl: _, ...persistable } = form;
      void _;
      saveStep<Step1Data>(1, persistable);
      router.push("/instructor/register/step-2");
    }
  };

  return (
    <PageShell>
      <div className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy mb-2">
          Créer votre profil de moniteur
        </h1>
        <p className="text-sm text-gray-400">Commençons par quelques informations personnelles.</p>
      </div>

      <StepProgress currentStep={0} />

      <FormCard title="Informations personnelles">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldWrapper label="Prénom" htmlFor="firstName" required error={errors.firstName}>
            <TextInput id="firstName" placeholder="Jean" value={form.firstName}
              onChange={(v) => update("firstName", v)} hasError={!!errors.firstName} autoComplete="given-name" />
          </FieldWrapper>
          <FieldWrapper label="Nom" htmlFor="lastName" required error={errors.lastName}>
            <TextInput id="lastName" placeholder="Dupont" value={form.lastName}
              onChange={(v) => update("lastName", v)} hasError={!!errors.lastName} autoComplete="family-name" />
          </FieldWrapper>
        </div>

        <FieldWrapper label="Adresse courriel" htmlFor="email" required error={errors.email}>
          <TextInput id="email" type="email" placeholder="jean.dupont@exemple.ca"
            value={form.email} onChange={(v) => update("email", v)}
            hasError={!!errors.email} autoComplete="email" />
        </FieldWrapper>

        <FieldWrapper label="Numéro de téléphone" htmlFor="phone" required error={errors.phone}>
          <TextInput id="phone" type="tel" placeholder="(506) 555-0123"
            value={form.phone} onChange={(v) => update("phone", v)}
            hasError={!!errors.phone} autoComplete="tel" />
        </FieldWrapper>

        <FieldWrapper label="Date de naissance" htmlFor="birthDate" required error={errors.birthDate}>
          <TextInput id="birthDate" type="date" value={form.birthDate}
            onChange={(v) => update("birthDate", v)}
            hasError={!!errors.birthDate} autoComplete="bday" />
        </FieldWrapper>

        <div className="border-t border-gray-100 pt-1" />

        <FieldWrapper label="Photo de profil" htmlFor="photo">
          <PhotoPicker
            photoUrl={form.photoUrl}
            onSelect={(url) => { saveProfilePhoto(url); update("photoUrl", url); }}
            onRemove={() => { clearProfilePhoto(); update("photoUrl", null); }}
          />
        </FieldWrapper>

      </FormCard>

      <NavButtons backHref="/instructor/account" onContinue={handleContinue} />
      <RequiredNotice />
    </PageShell>
  );
}
