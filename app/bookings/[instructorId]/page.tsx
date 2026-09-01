"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════ */

function IconArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function IconShieldCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function IconCheckCircleLarge() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconStarFilled() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24"
      fill="#F59E0B" stroke="#F59E0B" strokeWidth="1" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════ */

type BookingStep = "form" | "confirmed";

type DateOption = {
  value: string;
  dayShort: string;
  dayNum: string;
  monthShort: string;
  full: string;
};

type InstructorData = {
  initials: string;
  avatarBg: string;
  name: string;
  city: string;
  rating: number;
  reviewCount: number;
  price: number;
};

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════ */

const MOCK_INSTRUCTORS: Record<string, InstructorData> = {
  "thomas-m": {
    initials: "TM",
    avatarBg: "bg-navy",
    name: "Thomas M.",
    city: "Moncton",
    rating: 4.8,
    reviewCount: 47,
    price: 45,
  },
  "sophie-l": {
    initials: "SL",
    avatarBg: "bg-green-dp",
    name: "Sophie L.",
    city: "Saint John",
    rating: 4.9,
    reviewCount: 82,
    price: 50,
  },
  "karim-b": {
    initials: "KB",
    avatarBg: "bg-[#5B7FA6]",
    name: "Karim B.",
    city: "Fredericton",
    rating: 4.7,
    reviewCount: 31,
    price: 42,
  },
};

const LESSON_TYPES = [
  {
    id: "evaluation",
    label: "Première leçon d'évaluation",
    desc: "Bilan de votre niveau actuel",
  },
  {
    id: "regular",
    label: "Leçon de conduite",
    desc: "Apprentissage progressif",
  },
  {
    id: "exam",
    label: "Préparation à l'examen",
    desc: "Entraînement pour le permis",
  },
  {
    id: "accompanied",
    label: "Conduite supervisée",
    desc: "À partir de 16 ans",
  },
] as const;

const DURATIONS = [
  { id: "1h", label: "1 heure", multiplier: 1 },
  { id: "1h30", label: "1 h 30", multiplier: 1.5 },
  { id: "2h", label: "2 heures", multiplier: 2 },
] as const;

const MORNING_SLOTS = ["08:00", "09:00", "10:00", "11:00"];
const AFTERNOON_SLOTS = ["14:00", "15:00", "16:00", "17:00", "18:00"];

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */

function generateNextDates(count: number): DateOption[] {
  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const monthNames = [
    "jan.", "fév.", "mars", "avr.", "mai", "juin",
    "juil.", "août", "sept.", "oct.", "nov.", "déc.",
  ];
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      value: d.toISOString().split("T")[0],
      dayShort: dayNames[d.getDay()],
      dayNum: String(d.getDate()),
      monthShort: monthNames[d.getMonth()],
      full: `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`,
    };
  });
}

function getInstructor(id: string): InstructorData {
  return MOCK_INSTRUCTORS[id] ?? MOCK_INSTRUCTORS["karim-b"];
}

/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════════ */

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 flex-shrink-0">{label}</span>
      <span className="text-xs font-medium text-navy text-right">{value || "—"}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SHARED LAYOUT FRAGMENTS
═══════════════════════════════════════════════════════════ */

function PageHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 lg:px-10 flex items-center justify-between h-16">
        <Link href="/" className="flex-shrink-0 flex items-center">
          <Image
            src="/brand/logo-horizontal.png"
            alt="Drive-Path"
            width={160}
            height={44}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-navy transition-colors px-2 py-1"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold text-white bg-navy px-5 py-2 rounded-full hover:bg-navy-dark transition-colors shadow-sm"
          >
            S&apos;inscrire
          </Link>
        </nav>
      </div>
    </header>
  );
}

function PageFooter() {
  return (
    <footer className="bg-white border-t border-gray-100 px-6 py-8 mt-12">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/logo-horizontal.png"
            alt="Drive-Path"
            width={100}
            height={28}
            className="h-6 w-auto object-contain opacity-50"
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
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */

export default function BookingPage({
  params,
}: {
  params: Promise<{ instructorId: string }>;
}) {
  const { instructorId } = use(params);
  const instructor = getInstructor(instructorId);

  /* ── State ─────────────────────────────────── */
  const [step, setStep] = useState<BookingStep>("form");
  const [availableDates] = useState<DateOption[]>(() => generateNextDates(7));
  const [selectedDate, setSelectedDate] = useState<DateOption | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDurationId, setSelectedDurationId] = useState<"1h" | "1h30" | "2h">("1h");
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  /* ── Derived values ─────────────────────────── */
  const duration = DURATIONS.find((d) => d.id === selectedDurationId)!;
  const lessonType = LESSON_TYPES.find((t) => t.id === selectedTypeId);
  const price = Math.round(instructor.price * duration.multiplier);
  const formValid = !!(selectedDate && selectedTime && selectedTypeId);
  const isValid = formValid && acceptedTerms;

  /* ════════════════════════════════════════════
     CONFIRMATION VIEW
  ════════════════════════════════════════════ */
  if (step === "confirmed") {
    return (
      <main className="flex min-h-screen flex-col bg-white">
        <PageHeader />

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
          {/* Success icon */}
          <div className="w-24 h-24 rounded-full bg-green-dp/10 flex items-center justify-center text-green-dp mb-6">
            <IconCheckCircleLarge />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-navy mb-3">
            Réservation confirmée !
          </h1>
          <p className="text-gray-400 text-sm max-w-sm mb-10 leading-relaxed">
            Votre demande a bien été enregistrée. Vous recevrez une confirmation
            dès que le moniteur aura accepté votre créneau.
          </p>

          {/* Booking recap card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 w-full max-w-sm text-left mb-8">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Récapitulatif
            </h2>
            <div className="flex flex-col">
              <SummaryRow label="Moniteur" value={instructor.name} />
              <SummaryRow label="Ville" value={instructor.city} />
              <SummaryRow label="Date" value={selectedDate?.full ?? ""} />
              <SummaryRow label="Heure" value={selectedTime} />
              <SummaryRow label="Durée" value={duration.label} />
              <SummaryRow label="Type" value={lessonType?.label ?? ""} />
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm font-semibold text-navy">Total</span>
              <span className="text-2xl font-bold text-navy">{price} $</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/learner/bookings"
              className="inline-flex items-center justify-center bg-navy text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-navy-dark transition-colors"
            >
              Voir mes réservations
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center text-sm font-medium text-gray-500 hover:text-navy transition-colors px-6 py-3"
            >
              <IconArrowLeft />
              <span className="ml-2">Retour à l&apos;accueil</span>
            </Link>
          </div>
        </div>

        <PageFooter />
      </main>
    );
  }

  /* ════════════════════════════════════════════
     BOOKING FORM VIEW
  ════════════════════════════════════════════ */
  return (
    <main className="flex min-h-screen flex-col bg-surface">
      <PageHeader />

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 lg:px-10 py-8">

        {/* Back + heading */}
        <div className="mb-6">
          <Link
            href={`/profile/${instructorId}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-navy transition-colors mb-4"
          >
            <IconArrowLeft />
            Retour au profil
          </Link>
          <h1 className="text-2xl font-bold text-navy">Réserver une leçon</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">

          {/* ── Left column: form ── */}
          <div className="flex flex-col gap-5">

            {/* Instructor (readonly) */}
            <SectionCard title="Moniteur sélectionné">
              <div className="flex items-center gap-4">
                <div
                  className={`${instructor.avatarBg} w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0`}
                >
                  {instructor.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-navy">{instructor.name}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-dp bg-green-dp/10 px-2 py-0.5 rounded-full">
                      <IconShieldCheck />
                      Vérifié
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-400">{instructor.city}</span>
                    <span className="text-gray-200">·</span>
                    <div className="flex items-center gap-1">
                      <IconStarFilled />
                      <span className="text-xs font-semibold text-navy">{instructor.rating}</span>
                      <span className="text-xs text-gray-400">({instructor.reviewCount})</span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-xl font-bold text-navy">{instructor.price} $</div>
                  <div className="text-xs text-gray-400">/heure</div>
                </div>
              </div>
            </SectionCard>

            {/* Date picker */}
            <SectionCard title="Choisissez une date">
              <div className="flex gap-2 overflow-x-auto pb-1" suppressHydrationWarning>
                {availableDates.map((date) => {
                  const isSelected = selectedDate?.value === date.value;
                  return (
                    <button
                      key={date.value}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-xl border-2 transition-all duration-150 ${
                        isSelected
                          ? "border-navy bg-navy text-white"
                          : "border-gray-100 bg-white text-navy hover:border-navy/30"
                      }`}
                    >
                      <span className="text-xs font-semibold opacity-70">{date.dayShort}</span>
                      <span className="text-xl font-bold leading-tight">{date.dayNum}</span>
                      <span className="text-xs opacity-70">{date.monthShort}</span>
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            {/* Time slots */}
            <SectionCard title="Choisissez une heure">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-2">Matin</p>
                  <div className="grid grid-cols-4 gap-2">
                    {MORNING_SLOTS.map((slot) => {
                      const isSelected = selectedTime === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all duration-150 ${
                            isSelected
                              ? "border-navy bg-navy text-white"
                              : "border-gray-100 bg-white text-navy hover:border-navy/30"
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-2">Après-midi</p>
                  <div className="grid grid-cols-5 gap-2">
                    {AFTERNOON_SLOTS.map((slot) => {
                      const isSelected = selectedTime === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all duration-150 ${
                            isSelected
                              ? "border-navy bg-navy text-white"
                              : "border-gray-100 bg-white text-navy hover:border-navy/30"
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Duration */}
            <SectionCard title="Durée de la leçon">
              <div className="grid grid-cols-3 gap-3">
                {DURATIONS.map((dur) => {
                  const isSelected = selectedDurationId === dur.id;
                  const durPrice = Math.round(instructor.price * dur.multiplier);
                  return (
                    <button
                      key={dur.id}
                      type="button"
                      onClick={() => setSelectedDurationId(dur.id)}
                      className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all duration-150 ${
                        isSelected
                          ? "border-navy bg-navy text-white"
                          : "border-gray-100 bg-white text-navy hover:border-navy/30"
                      }`}
                    >
                      <span className="text-sm font-bold">{dur.label}</span>
                      <span className={`text-xs mt-1 ${isSelected ? "text-white/70" : "text-gray-400"}`}>
                        {durPrice} $
                      </span>
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            {/* Lesson type */}
            <SectionCard title="Type de leçon">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LESSON_TYPES.map((type) => {
                  const isSelected = selectedTypeId === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedTypeId(type.id)}
                      className={`flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                        isSelected
                          ? "border-navy bg-navy/5"
                          : "border-gray-100 bg-white hover:border-navy/20"
                      }`}
                    >
                      <span
                        className={`text-sm font-semibold leading-snug ${
                          isSelected ? "text-navy" : "text-gray-800"
                        }`}
                      >
                        {type.label}
                      </span>
                      <span className="text-xs text-gray-400 mt-1">{type.desc}</span>
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            {/* À savoir — Niveau 1 */}
            <div className="bg-surface border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-400"><IconInfo /></span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">À savoir</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mb-3">
                Drive-Path facilite la mise en relation entre apprenants et moniteurs.
                La prestation de conduite est réalisée directement entre vous et le moniteur.
                Drive-Path n&apos;est pas partie à cette prestation.
              </p>
              <Link
                href="/terms"
                className="text-xs font-medium text-navy hover:underline underline-offset-2 transition-colors"
              >
                Consulter nos conditions d&apos;utilisation →
              </Link>
            </div>

          </div>

          {/* ── Right column: summary ── */}
          <div className="lg:sticky lg:top-24 lg:self-start flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-navy mb-4">Récapitulatif</h2>

              <div className="flex flex-col">
                <SummaryRow label="Moniteur" value={instructor.name} />
                <SummaryRow label="Date" value={selectedDate?.full ?? ""} />
                <SummaryRow label="Heure" value={selectedTime} />
                <SummaryRow label="Durée" value={duration.label} />
                <SummaryRow label="Type" value={lessonType?.label ?? ""} />
              </div>

              {/* Total */}
              <div className="flex items-baseline justify-between mt-4 pt-4 border-t border-gray-100">
                <span className="text-sm font-semibold text-navy">Total</span>
                <div className="text-right">
                  <span className="text-2xl font-bold text-navy">{price} $</span>
                </div>
              </div>

              {/* Checkbox — Niveau 2 */}
              <label className="flex items-start gap-3 mt-5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border-gray-300 accent-navy cursor-pointer"
                />
                <span className="text-xs text-gray-500 leading-relaxed group-hover:text-gray-700 transition-colors">
                  J&apos;ai compris que Drive-Path agit comme une plateforme de mise en relation et que
                  la prestation de conduite est réalisée directement entre l&apos;apprenant et le moniteur.
                </span>
              </label>

              {/* Confirm button */}
              <button
                type="button"
                onClick={() => { if (isValid) setStep("confirmed"); }}
                disabled={!isValid}
                className={`mt-4 w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isValid
                    ? "bg-navy text-white hover:bg-navy-dark shadow-sm hover:shadow"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                Confirmer la réservation
              </button>

              {!isValid && (
                <p className="text-xs text-gray-400 text-center mt-3 leading-relaxed">
                  {!formValid
                    ? "Sélectionnez une date, une heure et un type de leçon pour continuer."
                    : "Veuillez cocher la case ci-dessus pour continuer."}
                </p>
              )}
            </div>

            {/* Trust note */}
            <div className="bg-green-dp/5 border border-green-dp/15 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-green-dp"><IconShieldCheck /></span>
                <span className="text-xs font-semibold text-green-dp">Réservation sécurisée</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Le paiement sera disponible dans une prochaine étape. Votre créneau est réservé à titre indicatif.
              </p>
            </div>

          </div>
        </div>
      </div>

      <PageFooter />
    </main>
  );
}
