"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PageShell, StepProgress, FormCard, FieldWrapper,
  TextInput, CheckOption, ToggleButton, NavButtons, RequiredNotice,
} from "../_shared";
import { saveStep, loadStep, DEFAULTS } from "../_store";
import type { Step4Data } from "../_store";

/* ═══════════════════════════════════════════════════════════
   DATA — Canadian context
═══════════════════════════════════════════════════════════ */

const LESSON_TYPES = [
  "Leçon de conduite",
  "Préparation à l'examen de conduite",
  "Perfectionnement",
  "Reprise de confiance",
  "Évaluation des compétences",
  "Conduite sur autoroute",
  "Préparation à la conduite hivernale",
] as const;

const DURATIONS = [
  { id: "30 min",  label: "30 min" },
  { id: "45 min",  label: "45 min" },
  { id: "60 min",  label: "60 min" },
  { id: "90 min",  label: "90 min" },
  { id: "120 min", label: "2 h" },
] as const;

const PACKAGES = [
  "5 leçons",
  "10 leçons",
  "Forfait préparation à l'examen",
] as const;

/* ═══════════════════════════════════════════════════════════
   VALIDATION
═══════════════════════════════════════════════════════════ */

type Errors = Partial<Record<keyof Omit<Step4Data, "packages">, string>>;

function validate(data: Step4Data): Errors {
  const errors: Errors = {};

  if (data.lessonTypes.length === 0)
    errors.lessonTypes = "Sélectionnez au moins un type de leçon.";

  if (!data.pricePerHour.trim()) {
    errors.pricePerHour = "Le tarif horaire est obligatoire.";
  } else {
    const n = Number(data.pricePerHour);
    if (isNaN(n) || n <= 0)
      errors.pricePerHour = "Le tarif doit être un nombre supérieur à 0.";
    else if (n > 1000)
      errors.pricePerHour = "Veuillez vérifier le tarif saisi.";
  }

  if (data.durations.length === 0)
    errors.durations = "Sélectionnez au moins une durée de leçon.";

  return errors;
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */

export default function RegisterStep4() {
  const router = useRouter();
  // Initialize with static defaults (SSR-safe) then restore from
  // sessionStorage after mount to avoid hydration mismatch.
  const [form, setForm] = useState<Step4Data>(DEFAULTS.step4);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setForm(loadStep<Step4Data>(4, DEFAULTS.step4));
  }, []);

  /* ── Helpers ──────────────────────────────────────────── */

  const update = <K extends keyof Step4Data>(key: K, value: Step4Data[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (submitted) setErrors(validate(next));
      return next;
    });
  };

  const toggleList = (key: "lessonTypes" | "durations" | "packages", val: string) => {
    const list = form[key] as string[];
    update(key, list.includes(val) ? list.filter((v) => v !== val) : [...list, val]);
  };

  const handleContinue = () => {
    setSubmitted(true);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      saveStep<Step4Data>(4, form);
      router.push("/instructor/register/step-5");
    }
  };

  /* ── Derived: estimated price per duration ────────────── */
  const hourlyRate = Number(form.pricePerHour) || 0;
  const durationMinutes: Record<string, number> = {
    "30 min": 30, "45 min": 45, "60 min": 60, "90 min": 90, "120 min": 120,
  };

  return (
    <PageShell>
      <div className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy mb-2">
          Vos services et vos tarifs
        </h1>
        <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
          Définissez les types de leçons que vous proposez et vos tarifs afin
          que les élèves sachent à quoi s&apos;attendre.
        </p>
      </div>

      <StepProgress currentStep={3} />

      <div className="flex flex-col gap-5">

        {/* ── Section 1 : Types de leçons ── */}
        <FormCard title="Types de leçons proposées">
          <FieldWrapper
            label="Sélectionnez les types de leçons"
            htmlFor="lessonTypes"
            required
            error={errors.lessonTypes}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {LESSON_TYPES.map((t) => (
                <CheckOption
                  key={t}
                  label={t}
                  checked={form.lessonTypes.includes(t)}
                  onChange={() => toggleList("lessonTypes", t)}
                />
              ))}
            </div>
          </FieldWrapper>
        </FormCard>

        {/* ── Section 2 : Tarifs ── */}
        <FormCard title="Tarifs">

          <FieldWrapper
            label="Tarif horaire ($ CAD)"
            htmlFor="pricePerHour"
            required
            error={errors.pricePerHour}
            hint="Tarif de base pour 60 minutes de leçon."
          >
            <TextInput
              id="pricePerHour"
              type="number"
              placeholder="65"
              value={form.pricePerHour}
              onChange={(v) => update("pricePerHour", v)}
              hasError={!!errors.pricePerHour}
            />
          </FieldWrapper>

          <FieldWrapper
            label="Durées de leçon proposées"
            htmlFor="durations"
            required
            error={errors.durations}
            hint="Sélectionnez toutes les durées que vous offrez."
          >
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {DURATIONS.map((d) => (
                <ToggleButton
                  key={d.id}
                  label={d.label}
                  selected={form.durations.includes(d.id)}
                  onClick={() => toggleList("durations", d.id)}
                />
              ))}
            </div>
          </FieldWrapper>

          {/* Estimated prices preview */}
          {hourlyRate > 0 && form.durations.length > 0 && (
            <div className="bg-surface rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Tarifs estimés par durée
              </p>
              <div className="flex flex-wrap gap-2">
                {form.durations.map((d) => {
                  const mins = durationMinutes[d] ?? 60;
                  const price = Math.round(hourlyRate * mins / 60);
                  const dLabel = DURATIONS.find((x) => x.id === d)?.label ?? d;
                  return (
                    <div
                      key={d}
                      className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2"
                    >
                      <span className="text-xs text-gray-500">{dLabel}</span>
                      <span className="text-xs font-bold text-navy">{price} $</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Ces montants sont calculés automatiquement d&apos;après votre tarif horaire.
                Les prix réels peuvent varier.
              </p>
            </div>
          )}

        </FormCard>

        {/* ── Section 3 : Forfaits (optionnel) ── */}
        <FormCard title="Forfaits (optionnel)">
          <FieldWrapper
            label="Proposez-vous des forfaits ?"
            htmlFor="packages"
            hint="Facultatif — laissez vide si vous ne proposez pas de forfaits."
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PACKAGES.map((p) => (
                <CheckOption
                  key={p}
                  label={p}
                  checked={form.packages.includes(p)}
                  onChange={() => toggleList("packages", p)}
                />
              ))}
            </div>
          </FieldWrapper>
        </FormCard>

      </div>

      <NavButtons backHref="/instructor/register/step-3" onContinue={handleContinue} />
      <RequiredNotice />
    </PageShell>
  );
}
