/* ═══════════════════════════════════════════════════════════
   MULTI-STEP INSTRUCTOR REGISTRATION — State Store
   Persists form data across steps via sessionStorage.
   Replace with API/server state in a future step.
═══════════════════════════════════════════════════════════ */

/** Step 0 — account creation (3A) */
export type Step0Data = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // password is NOT persisted to sessionStorage for security
};

export type Step1Data = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  // photoUrl: local object URL — not persisted to sessionStorage
};

export type Step2Data = {
  street: string;
  complement: string;
  city: string;
  postalCode: string;
  province: string;
  activityRadius: string;
};

export type Step3Data = {
  status: string;
  certificationNumber: string;
  yearsExperience: string;
  specialties: string[];
  bio: string;
  // photoUrl: local object URL — not persisted to sessionStorage
};

export type Step4Data = {
  lessonTypes: string[];
  pricePerHour: string;
  durations: string[];
  packages: string[];
};

export type Step5Data = {
  brand: string;
  model: string;
  year: string;
  gearbox: string;
  color: string;
};

export type Step6Data = {
  days: string[];
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
};

/* ── Defaults ──────────────────────────────────────────── */

export const DEFAULTS: {
  step0: Step0Data;
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
  step5: Step5Data;
  step6: Step6Data;
} = {
  step0: { firstName: "", lastName: "", email: "", phone: "" },
  step1: { firstName: "", lastName: "", email: "", phone: "", birthDate: "" },
  step2: { street: "", complement: "", city: "", postalCode: "", province: "", activityRadius: "" },
  step3: { status: "", certificationNumber: "", yearsExperience: "", specialties: [], bio: "" },
  step4: { lessonTypes: [], pricePerHour: "", durations: [], packages: [] },
  step5: { brand: "", model: "", year: "", gearbox: "", color: "" },
  step6: { days: [], morning: false, afternoon: false, evening: false },
};

/* ── Helpers ───────────────────────────────────────────── */

const KEY = (step: number) => `dp_reg_step${step}`;

export function saveStep<T>(step: number, data: T): void {
  try {
    sessionStorage.setItem(KEY(step), JSON.stringify(data));
  } catch {
    // sessionStorage unavailable (SSR, private mode)
  }
}

export function loadStep<T>(step: number, defaults: T): T {
  try {
    const raw = sessionStorage.getItem(KEY(step));
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) } as T;
  } catch {
    return defaults;
  }
}

export function loadAll() {
  return {
    step1: loadStep<Step1Data>(1, DEFAULTS.step1),
    step2: loadStep<Step2Data>(2, DEFAULTS.step2),
    step3: loadStep<Step3Data>(3, DEFAULTS.step3),
    step4: loadStep<Step4Data>(4, DEFAULTS.step4),
    step5: loadStep<Step5Data>(5, DEFAULTS.step5),
    step6: loadStep<Step6Data>(6, DEFAULTS.step6),
  };
}
