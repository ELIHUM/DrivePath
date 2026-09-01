"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PageShell, StepProgress, FormCard, FieldWrapper,
  ToggleButton, NavButtons, RequiredNotice,
} from "../_shared";
import { saveStep, loadStep, DEFAULTS } from "../_store";
import type { Step6Data } from "../_store";

const DAYS: { key: string; label: string; short: string }[] = [
  { key: "lun", label: "Lundi",    short: "Lun" },
  { key: "mar", label: "Mardi",    short: "Mar" },
  { key: "mer", label: "Mercredi", short: "Mer" },
  { key: "jeu", label: "Jeudi",    short: "Jeu" },
  { key: "ven", label: "Vendredi", short: "Ven" },
  { key: "sam", label: "Samedi",   short: "Sam" },
  { key: "dim", label: "Dimanche", short: "Dim" },
];

const SLOTS: { key: keyof Pick<Step6Data, "morning" | "afternoon" | "evening">; label: string; desc: string }[] = [
  { key: "morning",   label: "Matin",      desc: "8 h – 12 h"  },
  { key: "afternoon", label: "Après-midi", desc: "14 h – 18 h" },
  { key: "evening",   label: "Soirée",     desc: "18 h – 21 h" },
];

type Errors = { days?: string; slots?: string };

function validate(data: Step6Data): Errors {
  const errors: Errors = {};
  if (data.days.length === 0)
    errors.days = "Sélectionnez au moins un jour.";
  if (!data.morning && !data.afternoon && !data.evening)
    errors.slots = "Sélectionnez au moins une plage horaire.";
  return errors;
}

export default function RegisterStep6() {
  const router = useRouter();
  const [form, setForm] = useState<Step6Data>(() => loadStep<Step6Data>(6, DEFAULTS.step6));
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  const revalidate = (next: Step6Data) => {
    if (submitted) setErrors(validate(next));
  };

  const toggleDay = (key: string) => {
    const next = {
      ...form,
      days: form.days.includes(key)
        ? form.days.filter((d) => d !== key)
        : [...form.days, key],
    };
    setForm(next);
    revalidate(next);
  };

  const toggleSlot = (key: "morning" | "afternoon" | "evening") => {
    const next = { ...form, [key]: !form[key] };
    setForm(next);
    revalidate(next);
  };

  const handleContinue = () => {
    setSubmitted(true);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      saveStep<Step6Data>(6, form);
      router.push("/instructor/register/step-7");
    }
  };

  return (
    <PageShell>
      <div className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy mb-2">Créer votre profil de moniteur</h1>
        <p className="text-sm text-gray-400">Quels sont vos créneaux de disponibilité habituels ?</p>
      </div>

      <StepProgress currentStep={5} />

      <FormCard title="Disponibilités">

        {/* Days */}
        <FieldWrapper label="Jours disponibles" htmlFor="days" required error={errors.days}>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {DAYS.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => toggleDay(d.key)}
                className={`flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all text-center ${
                  form.days.includes(d.key)
                    ? "border-navy bg-navy text-white"
                    : "border-gray-100 bg-white text-navy hover:border-navy/30"
                }`}
              >
                <span className="text-[11px] font-bold">{d.short}</span>
              </button>
            ))}
          </div>
          {form.days.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {form.days.map((k) => DAYS.find((d) => d.key === k)?.label).filter(Boolean).join(", ")}
            </p>
          )}
        </FieldWrapper>

        {/* Time slots */}
        <FieldWrapper label="Plages horaires" htmlFor="slots" required error={errors.slots}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SLOTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => toggleSlot(s.key)}
                className={`flex flex-col items-center justify-center py-4 px-3 rounded-xl border-2 transition-all text-center gap-1 ${
                  form[s.key]
                    ? "border-navy bg-navy text-white"
                    : "border-gray-100 bg-white text-navy hover:border-navy/30"
                }`}
              >
                <span className="text-sm font-bold">{s.label}</span>
                <span className={`text-xs ${form[s.key] ? "text-white/70" : "text-gray-400"}`}>{s.desc}</span>
              </button>
            ))}
          </div>
        </FieldWrapper>

        {/* Summary */}
        {(form.days.length > 0 || form.morning || form.afternoon || form.evening) && (
          <div className="bg-surface rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Récapitulatif</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              {form.days.length > 0
                ? form.days.map((k) => DAYS.find((d) => d.key === k)?.label).filter(Boolean).join(", ")
                : "Aucun jour sélectionné"}
              {(form.morning || form.afternoon || form.evening) && (
                <span className="text-gray-400">
                  {" · "}
                  {[form.morning && "Matin", form.afternoon && "Après-midi", form.evening && "Soirée"]
                    .filter(Boolean).join(", ")}
                </span>
              )}
            </p>
          </div>
        )}

      </FormCard>

      <NavButtons backHref="/instructor/register/step-5" onContinue={handleContinue} />
      <RequiredNotice />
    </PageShell>
  );
}
