"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PageShell, StepProgress, FormCard, FieldWrapper,
  TextInput, SelectInput, NavButtons, RequiredNotice,
} from "../_shared";
import { saveStep, loadStep, DEFAULTS } from "../_store";
import type { Step2Data } from "../_store";

/* ═══════════════════════════════════════════════════════════
   CANADIAN PROVINCES & TERRITORIES
═══════════════════════════════════════════════════════════ */

const PROVINCES = [
  "Alberta",
  "Colombie-Britannique",
  "Île-du-Prince-Édouard",
  "Manitoba",
  "Nouveau-Brunswick",
  "Nouvelle-Écosse",
  "Nunavut",
  "Ontario",
  "Québec",
  "Saskatchewan",
  "Terre-Neuve-et-Labrador",
  "Territoires du Nord-Ouest",
  "Yukon",
] as const;

/* ═══════════════════════════════════════════════════════════
   CANADIAN POSTAL CODE HELPERS
   Valid format: A1A 1A1 (letter-digit-letter space digit-letter-digit)
   Accepts with or without space; normalises to "A1A 1A1".
═══════════════════════════════════════════════════════════ */

const CA_POSTAL_RE = /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/;

function normalizePostalCode(raw: string): string {
  const clean = raw.toUpperCase().replace(/\s/g, "");
  if (clean.length === 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
  return raw.toUpperCase();
}

/* ═══════════════════════════════════════════════════════════
   VALIDATION
═══════════════════════════════════════════════════════════ */

type Errors = Partial<Record<Exclude<keyof Step2Data, "complement">, string>>;

function validate(data: Step2Data): Errors {
  const errors: Errors = {};
  if (!data.street.trim())   errors.street   = "L'adresse est obligatoire.";
  if (!data.city.trim())     errors.city     = "La ville est obligatoire.";
  if (!data.province.trim()) errors.province = "La province ou le territoire est obligatoire.";
  if (!data.postalCode.trim())
    errors.postalCode = "Le code postal est obligatoire.";
  else if (!CA_POSTAL_RE.test(data.postalCode.trim()))
    errors.postalCode = "Entrez un code postal canadien valide (ex. E1A 3H6).";
  if (!data.activityRadius)
    errors.activityRadius = "Veuillez sélectionner une zone d'activité.";
  return errors;
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */

export default function RegisterStep2() {
  const router = useRouter();
  const [form, setForm] = useState<Step2Data>(() => loadStep<Step2Data>(2, DEFAULTS.step2));
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  const update = (key: keyof Step2Data, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (submitted) setErrors(validate(next));
      return next;
    });
  };

  /* Normalise postal code on blur */
  const handlePostalBlur = () => {
    if (form.postalCode) {
      update("postalCode", normalizePostalCode(form.postalCode));
    }
  };

  const handleContinue = () => {
    setSubmitted(true);
    // Normalise before validating
    const normalised = { ...form, postalCode: normalizePostalCode(form.postalCode) };
    setForm(normalised);
    const errs = validate(normalised);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      saveStep<Step2Data>(2, normalised);
      router.push("/instructor/register/step-3");
    }
  };

  return (
    <PageShell>
      <div className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy mb-2">Créer votre profil de moniteur</h1>
        <p className="text-sm text-gray-400">Où exercez-vous votre activité ?</p>
      </div>

      <StepProgress currentStep={1} />

      <FormCard title="Adresse et zone d'activité">

        <FieldWrapper label="Adresse" htmlFor="street" required error={errors.street}>
          <TextInput id="street" placeholder="123, rue Principale" value={form.street}
            onChange={(v) => update("street", v)} hasError={!!errors.street} autoComplete="street-address" />
        </FieldWrapper>

        <FieldWrapper label="Complément d'adresse" htmlFor="complement">
          <TextInput id="complement" placeholder="Appartement, bureau, suite…"
            value={form.complement} onChange={(v) => update("complement", v)} />
        </FieldWrapper>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldWrapper label="Ville" htmlFor="city" required error={errors.city}>
            <TextInput id="city" placeholder="Moncton" value={form.city}
              onChange={(v) => update("city", v)} hasError={!!errors.city} autoComplete="address-level2" />
          </FieldWrapper>
          <FieldWrapper label="Code postal" htmlFor="postalCode" required error={errors.postalCode}
            hint="Format : E1A 3H6">
            <input
              id="postalCode"
              name="postalCode"
              type="text"
              placeholder="E1A 3H6"
              value={form.postalCode}
              autoComplete="postal-code"
              onChange={(e) => update("postalCode", e.target.value.toUpperCase())}
              onBlur={handlePostalBlur}
              maxLength={7}
              className={`w-full rounded-xl border px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all
                focus:ring-2 focus:ring-navy/20 focus:border-navy
                ${errors.postalCode ? "border-red-300 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
            />
          </FieldWrapper>
        </div>

        <FieldWrapper label="Province / territoire" htmlFor="province" required error={errors.province}>
          <SelectInput id="province" value={form.province}
            onChange={(v) => update("province", v)} hasError={!!errors.province}>
            <option value="">Sélectionnez une province ou un territoire…</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </SelectInput>
        </FieldWrapper>

        <FieldWrapper
          label="Zone d'activité" htmlFor="activityRadius" required
          error={errors.activityRadius}
          hint="Distance maximale que vous acceptez de parcourir pour vos leçons."
        >
          <SelectInput id="activityRadius" value={form.activityRadius}
            onChange={(v) => update("activityRadius", v)} hasError={!!errors.activityRadius}>
            <option value="">Sélectionner un rayon…</option>
            <option value="5">Jusqu&apos;à 5 km</option>
            <option value="10">Jusqu&apos;à 10 km</option>
            <option value="20">Jusqu&apos;à 20 km</option>
            <option value="50">Jusqu&apos;à 50 km</option>
          </SelectInput>
        </FieldWrapper>

      </FormCard>

      <NavButtons backHref="/instructor/register" onContinue={handleContinue} />
      <RequiredNotice />
    </PageShell>
  );
}
