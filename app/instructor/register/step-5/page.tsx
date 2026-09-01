"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PageShell, StepProgress, FormCard, FieldWrapper,
  TextInput, ToggleButton, NavButtons, RequiredNotice,
} from "../_shared";
import { saveStep, loadStep, DEFAULTS } from "../_store";
import type { Step5Data } from "../_store";

type Errors = Partial<Record<Exclude<keyof Step5Data, "color">, string>>;

const CURRENT_YEAR = new Date().getFullYear();

function validate(data: Step5Data): Errors {
  const errors: Errors = {};
  if (!data.brand.trim())  errors.brand = "La marque est obligatoire.";
  if (!data.model.trim())  errors.model = "Le modèle est obligatoire.";
  if (!data.year.trim()) {
    errors.year = "L'année est obligatoire.";
  } else {
    const y = Number(data.year);
    if (isNaN(y) || y < 1990 || y > CURRENT_YEAR + 1)
      errors.year = `L'année doit être comprise entre 1990 et ${CURRENT_YEAR + 1}.`;
  }
  if (!data.gearbox) errors.gearbox = "Veuillez sélectionner le type de boîte.";
  return errors;
}

export default function RegisterStep5() {
  const router = useRouter();
  const [form, setForm] = useState<Step5Data>(() => loadStep<Step5Data>(5, DEFAULTS.step5));
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof Step5Data>(key: K, value: Step5Data[K]) => {
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
      saveStep<Step5Data>(5, form);
      router.push("/instructor/register/step-6");
    }
  };

  return (
    <PageShell>
      <div className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy mb-2">Créer votre profil de moniteur</h1>
        <p className="text-sm text-gray-400">Renseignez le véhicule que vous utilisez pour les leçons.</p>
      </div>

      <StepProgress currentStep={4} />

      <FormCard title="Véhicule d'apprentissage">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldWrapper label="Marque" htmlFor="brand" required error={errors.brand}>
            <TextInput id="brand" placeholder="Toyota" value={form.brand}
              onChange={(v) => update("brand", v)} hasError={!!errors.brand} />
          </FieldWrapper>
          <FieldWrapper label="Modèle" htmlFor="model" required error={errors.model}>
            <TextInput id="model" placeholder="Corolla" value={form.model}
              onChange={(v) => update("model", v)} hasError={!!errors.model} />
          </FieldWrapper>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldWrapper label="Année" htmlFor="year" required error={errors.year}>
            <TextInput id="year" type="number" placeholder={String(CURRENT_YEAR - 3)}
              value={form.year} onChange={(v) => update("year", v)} hasError={!!errors.year} />
          </FieldWrapper>
          <FieldWrapper label="Couleur" htmlFor="color">
            <TextInput id="color" placeholder="Gris" value={form.color}
              onChange={(v) => update("color", v)} />
          </FieldWrapper>
        </div>

        <FieldWrapper label="Type de boîte" htmlFor="gearbox" required error={errors.gearbox}>
          <div className="grid grid-cols-2 gap-3">
            <ToggleButton
              label="Boîte manuelle"
              selected={form.gearbox === "manual"}
              onClick={() => update("gearbox", "manual")}
            />
            <ToggleButton
              label="Boîte automatique"
              selected={form.gearbox === "automatic"}
              onClick={() => update("gearbox", "automatic")}
            />
          </div>
        </FieldWrapper>

      </FormCard>

      <NavButtons backHref="/instructor/register/step-4" onContinue={handleContinue} />
      <RequiredNotice />
    </PageShell>
  );
}
