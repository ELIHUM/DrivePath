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
   DATA — Canadian context / Nouveau-Brunswick
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

type DurationDef = { id: string; label: string; badge?: string };

const DURATIONS: readonly DurationDef[] = [
  { id: "30 min",  label: "30 min" },
  { id: "45 min",  label: "45 min" },
  { id: "60 min",  label: "60 min" },
  { id: "90 min",  label: "90 min",  badge: "⭐ Meilleur choix" },
  { id: "120 min", label: "2 h",     badge: "🔥 Meilleure valeur" },
];

const PACKAGES = [
  "5 leçons",
  "10 leçons",
  "Forfait préparation à l'examen",
] as const;

/* ═══════════════════════════════════════════════════════════
   PRICING LOGIC — marketing multipliers
   60 min = tarif horaire de référence (1.0×)
   Courtes séances : légèrement au-dessus du prorata → encourage les séances longues
   Longues séances : remise progressive → encourage la montée en gamme
═══════════════════════════════════════════════════════════ */

const DURATION_MULTIPLIERS: Record<string, number> = {
  "30 min":  0.60,  // 50 $/h → 30 $  (prorata = 25 $)
  "45 min":  0.85,  // 50 $/h → 43 $  (prorata = 37,50 $)
  "60 min":  1.00,  // tarif de référence
  "90 min":  1.40,  // 50 $/h → 70 $  (prorata = 75 $) — remise
  "120 min": 1.80,  // 50 $/h → 90 $  (prorata = 100 $) — remise plus importante
};

function suggestPrice(hourlyRate: number, durationId: string): string {
  const mult = DURATION_MULTIPLIERS[durationId] ?? 1;
  return String(Math.round(hourlyRate * mult));
}

/* ═══════════════════════════════════════════════════════════
   VALIDATION
═══════════════════════════════════════════════════════════ */

type Errors = Partial<Record<
  "lessonTypes" | "pricePerHour" | "durations" | "durationPrices",
  string
>>;

function validate(data: Step4Data): Errors {
  const errors: Errors = {};

  if (data.lessonTypes.length === 0)
    errors.lessonTypes = "Sélectionnez au moins un type de leçon.";

  if (!data.pricePerHour.trim()) {
    errors.pricePerHour = "Le tarif horaire est obligatoire.";
  } else {
    const n = Number(data.pricePerHour);
    if (isNaN(n) || n < 10)
      errors.pricePerHour = "Le tarif minimum est de 10 $.";
    else if (n > 200)
      errors.pricePerHour = "Le tarif maximum est de 200 $.";
  }

  if (data.durations.length === 0) {
    errors.durations = "Sélectionnez au moins une durée de leçon.";
  } else {
    for (const dur of data.durations) {
      const price = data.durationPrices[dur];
      if (!price || !price.trim()) {
        errors.durationPrices = "Tous les tarifs par durée sont obligatoires.";
        break;
      }
      if (isNaN(Number(price)) || Number(price) <= 0) {
        errors.durationPrices = "Les tarifs par durée doivent être supérieurs à 0.";
        break;
      }
    }
  }

  return errors;
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */

export default function RegisterStep4() {
  const router = useRouter();

  // SSR-safe: static defaults on first render, sessionStorage restored in useEffect
  const [form, setForm] = useState<Step4Data>(DEFAULTS.step4);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const loaded = loadStep<Step4Data>(4, DEFAULTS.step4);
    // Backwards compat: populate missing duration prices from hourly rate
    // (happens when sessionStorage was saved before durationPrices was introduced)
    const rate = Number(loaded.pricePerHour);
    if (!isNaN(rate) && rate > 0 && loaded.durations.length > 0) {
      const prices = { ...loaded.durationPrices };
      let changed = false;
      for (const dur of loaded.durations) {
        if (!prices[dur]) {
          prices[dur] = suggestPrice(rate, dur);
          changed = true;
        }
      }
      setForm(changed ? { ...loaded, durationPrices: prices } : loaded);
    } else {
      setForm(loaded);
    }
  }, []);

  /* ── Generic list toggle (lessonTypes, packages) ─────── */
  const toggleList = (key: "lessonTypes" | "packages", val: string) => {
    setForm((prev) => {
      const list = prev[key] as string[];
      const next = {
        ...prev,
        [key]: list.includes(val) ? list.filter((v) => v !== val) : [...list, val],
      };
      if (submitted) setErrors(validate(next));
      return next;
    });
  };

  /* ── Hourly rate change — recalculate non-customized prices ── */
  const handleHourlyRateChange = (val: string) => {
    setForm((prev) => {
      const rate = Number(val);
      const newDurationPrices = { ...prev.durationPrices };
      if (!isNaN(rate) && rate > 0) {
        for (const dur of prev.durations) {
          if (!prev.customizedPrices.includes(dur)) {
            newDurationPrices[dur] = suggestPrice(rate, dur);
          }
        }
      }
      const next = { ...prev, pricePerHour: val, durationPrices: newDurationPrices };
      if (submitted) setErrors(validate(next));
      return next;
    });
  };

  /* ── Duration toggle — calculate suggested price on select ── */
  const toggleDuration = (durId: string) => {
    setForm((prev) => {
      const list = prev.durations;
      if (list.includes(durId)) {
        // Deselect: remove price and customized flag
        const newPrices = { ...prev.durationPrices };
        delete newPrices[durId];
        const next = {
          ...prev,
          durations: list.filter((d) => d !== durId),
          durationPrices: newPrices,
          customizedPrices: prev.customizedPrices.filter((d) => d !== durId),
        };
        if (submitted) setErrors(validate(next));
        return next;
      } else {
        // Select: generate suggested price from current hourly rate
        const rate = Number(prev.pricePerHour);
        const newPrices = { ...prev.durationPrices };
        if (!isNaN(rate) && rate > 0) {
          newPrices[durId] = suggestPrice(rate, durId);
        }
        const next = {
          ...prev,
          durations: [...list, durId],
          durationPrices: newPrices,
          // not added to customizedPrices — it's a suggestion
        };
        if (submitted) setErrors(validate(next));
        return next;
      }
    });
  };

  /* ── Individual duration price edit — mark as customized ── */
  const handleDurationPriceChange = (durId: string, val: string) => {
    setForm((prev) => {
      const next = {
        ...prev,
        durationPrices: { ...prev.durationPrices, [durId]: val },
        customizedPrices: prev.customizedPrices.includes(durId)
          ? prev.customizedPrices
          : [...prev.customizedPrices, durId],
      };
      if (submitted) setErrors(validate(next));
      return next;
    });
  };

  const handleContinue = () => {
    setSubmitted(true);

    // Safety net: compute any missing duration prices from the hourly rate
    // before validation, in case of timing edge cases or stale state.
    const rate = Number(form.pricePerHour);
    const ensuredPrices = { ...form.durationPrices };
    if (!isNaN(rate) && rate > 0) {
      for (const dur of form.durations) {
        if (!ensuredPrices[dur]) {
          ensuredPrices[dur] = suggestPrice(rate, dur);
        }
      }
    }
    const effectiveForm: Step4Data = { ...form, durationPrices: ensuredPrices };

    const errs = validate(effectiveForm);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setForm(effectiveForm);
      saveStep<Step4Data>(4, effectiveForm);
      router.push("/instructor/register/step-5");
    }
  };

  /* ── Derived ──────────────────────────────────────────── */
  // Durations in display order (preserving DURATIONS array order)
  const selectedDurations = DURATIONS.filter((d) => form.durations.includes(d.id));

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

          {/* Tarif horaire */}
          <FieldWrapper
            label="Tarif horaire ($ CAD)"
            htmlFor="pricePerHour"
            required
            error={errors.pricePerHour}
            hint="Tarif de référence pour 60 minutes. Minimum 10 $, maximum 200 $."
          >
            <TextInput
              id="pricePerHour"
              type="number"
              placeholder="65"
              value={form.pricePerHour}
              onChange={handleHourlyRateChange}
              hasError={!!errors.pricePerHour}
            />
          </FieldWrapper>

          {/* Durées */}
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
                  onClick={() => toggleDuration(d.id)}
                />
              ))}
            </div>
          </FieldWrapper>

          {/* Tarif par durée — affiché dès qu'une durée est sélectionnée */}
          {selectedDurations.length > 0 && (
            <FieldWrapper
              label="Vos tarifs par durée"
              htmlFor="durationPrices"
              required
              error={errors.durationPrices}
              hint="Calculés automatiquement à partir de votre tarif horaire. Modifiez librement chaque montant."
            >
              <div className="flex flex-col gap-3">
                {selectedDurations.map((d) => {
                  const priceVal = form.durationPrices[d.id] ?? "";
                  const isCustomized = form.customizedPrices.includes(d.id);
                  const hasErr =
                    submitted &&
                    (!priceVal.trim() || isNaN(Number(priceVal)) || Number(priceVal) <= 0);

                  return (
                    <div key={d.id} className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                      {/* Duration label */}
                      <span className="w-16 flex-shrink-0 text-sm font-semibold text-navy">
                        {d.label}
                      </span>

                      {/* Price input */}
                      <div className="w-28 flex-shrink-0">
                        <TextInput
                          id={`price-${d.id}`}
                          type="number"
                          placeholder="0"
                          value={priceVal}
                          onChange={(v) => handleDurationPriceChange(d.id, v)}
                          hasError={hasErr}
                        />
                      </div>

                      <span className="text-sm text-gray-400 flex-shrink-0">$ CAD</span>

                      {/* Marketing badge */}
                      {d.badge && (
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {d.badge}
                        </span>
                      )}

                      {/* Customized indicator */}
                      {isCustomized && (
                        <span className="text-xs text-navy/40 flex-shrink-0 hidden sm:inline">
                          personnalisé
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </FieldWrapper>
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
