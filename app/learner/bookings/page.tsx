"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MOCK_BOOKINGS, type MockBooking, type BookingStatus } from "./_data";

/* ═══════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════ */

function IconArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconShieldCheck() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function IconBookmark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   STATUS BADGE
═══════════════════════════════════════════════════════════ */

function StatusBadge({ status }: { status: BookingStatus }) {
  const config: Record<BookingStatus, { label: string; classes: string }> = {
    confirmed: { label: "Confirmée",   classes: "bg-green-dp/10 text-green-dp" },
    pending:   { label: "En attente",  classes: "bg-amber-50 text-amber-700 border border-amber-200" },
    completed: { label: "Terminée",    classes: "bg-gray-100 text-gray-500" },
    cancelled: { label: "Annulée",     classes: "bg-red-50 text-red-600" },
  };
  const { label, classes } = config[status];
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${classes}`}>
      {label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   INFO ROW (icon + text)
═══════════════════════════════════════════════════════════ */

function InfoRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2.5 text-sm text-gray-500">
      <span className="text-gray-400 flex-shrink-0 mt-0.5">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   UPCOMING BOOKING CARD
═══════════════════════════════════════════════════════════ */

function UpcomingBookingCard({ booking }: { booking: MockBooking }) {
  return (
    <article className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 p-5 sm:p-6">

      {/* Header: avatar + name + verified + status */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`${booking.instructorAvatarBg} w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
          >
            {booking.instructorInitials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="font-bold text-navy text-sm">{booking.instructorName}</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-dp bg-green-dp/10 px-2 py-0.5 rounded-full flex-shrink-0">
                <IconShieldCheck />
                Vérifié
              </span>
            </div>
            <span className="text-xs text-gray-400">{booking.instructorCity}</span>
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {/* Info rows */}
      <div className="flex flex-col gap-2 mb-5">
        <InfoRow icon={<IconCalendar />} text={booking.dateLabel} />
        <InfoRow icon={<IconClock />}    text={`${booking.timeStart} — ${booking.timeEnd} · ${booking.duration}`} />
        <InfoRow icon={<IconMapPin />}   text={`${booking.lessonType} · ${booking.instructorCity}`} />
      </div>

      {/* Footer: price + CTA */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto gap-3 flex-wrap">
        <div>
          <span className="text-xl font-bold text-navy">{booking.price}€</span>
          <span className="text-xs text-gray-400 ml-1">/séance</span>
        </div>
        <Link
          href={`/learner/bookings/${booking.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-navy px-4 py-2 rounded-full hover:bg-navy-dark transition-colors flex-shrink-0"
        >
          Voir les détails
          <IconArrowRight />
        </Link>
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAST BOOKING CARD
═══════════════════════════════════════════════════════════ */

function PastBookingCard({ booking }: { booking: MockBooking }) {
  return (
    <article className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">

      {/* Header: avatar + name + status */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`${booking.instructorAvatarBg} w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 opacity-70`}
          >
            {booking.instructorInitials}
          </div>
          <div className="min-w-0">
            <span className="block font-bold text-navy text-sm mb-0.5">{booking.instructorName}</span>
            <span className="text-xs text-gray-400">{booking.instructorCity}</span>
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {/* Info rows */}
      <div className="flex flex-col gap-2 mb-5">
        <InfoRow icon={<IconCalendar />} text={booking.dateLabel} />
        <InfoRow icon={<IconClock />}    text={`${booking.timeStart} — ${booking.timeEnd} · ${booking.duration}`} />
        <InfoRow icon={<IconMapPin />}   text={booking.lessonType} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto gap-3 flex-wrap">
        <div>
          <span className="text-xl font-bold text-navy">{booking.price}€</span>
          <span className="text-xs text-gray-400 ml-1">/séance</span>
        </div>
        <div className="flex items-center gap-2">
          {booking.status === "completed" && (
            <button
              type="button"
              className="text-xs font-medium text-gray-500 hover:text-navy px-3 py-2 rounded-full border border-gray-200 hover:border-navy/30 transition-colors"
            >
              Laisser un avis
            </button>
          )}
          <Link
            href={`/learner/bookings/${booking.id}`}
            className="text-xs font-semibold text-navy px-3 py-2 rounded-full hover:bg-navy/5 transition-colors"
          >
            Voir les détails
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════
   EMPTY STATE
═══════════════════════════════════════════════════════════ */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-300 mb-6">
        <IconBookmark />
      </div>
      <h2 className="text-lg font-bold text-navy mb-2">
        Vous n&apos;avez encore aucune réservation.
      </h2>
      <p className="text-sm text-gray-400 max-w-xs leading-relaxed mb-8">
        Trouvez un moniteur et commencez votre parcours vers le permis de conduire.
      </p>
      <Link
        href="/learner"
        className="inline-flex items-center gap-2 bg-navy text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-navy-dark transition-colors"
      >
        Trouver un moniteur
        <IconArrowRight />
      </Link>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   FILTER TYPE
═══════════════════════════════════════════════════════════ */

type FilterKey = "all" | "upcoming" | "completed" | "cancelled";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all",       label: "Toutes" },
  { key: "upcoming",  label: "À venir" },
  { key: "completed", label: "Terminées" },
  { key: "cancelled", label: "Annulées" },
];

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */

export default function LearnerBookingsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  /* ── Filter logic ─────────────────────────────── */
  const filteredUpcoming = MOCK_BOOKINGS.filter((b) => {
    if (activeFilter === "completed" || activeFilter === "cancelled") return false;
    return b.status === "confirmed" || b.status === "pending";
  });

  const filteredPast = MOCK_BOOKINGS.filter((b) => {
    if (activeFilter === "upcoming") return false;
    if (b.status !== "completed" && b.status !== "cancelled") return false;
    if (activeFilter === "completed") return b.status === "completed";
    if (activeFilter === "cancelled") return b.status === "cancelled";
    return true;
  });

  const isEmpty = filteredUpcoming.length === 0 && filteredPast.length === 0;

  return (
    <main className="flex min-h-screen flex-col bg-surface">

      {/* ════════════════════════════════════════
          HEADER
      ════════════════════════════════════════ */}
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
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-navy transition-colors px-2 py-1"
            >
              Connexion
            </Link>
          </nav>
        </div>
      </header>

      {/* ════════════════════════════════════════
          LEARNER NAV
      ════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <nav className="flex gap-6 sm:gap-8" aria-label="Espace apprenant">
            <Link
              href="/learner"
              className="text-sm font-medium text-gray-500 hover:text-navy py-3.5 border-b-2 border-transparent transition-colors"
            >
              Trouver un moniteur
            </Link>
            <span
              className="text-sm font-semibold text-navy py-3.5 border-b-2 border-navy cursor-default select-none"
              aria-current="page"
            >
              Mes réservations
            </span>
            <button
              type="button"
              className="text-sm font-medium text-gray-500 hover:text-navy py-3.5 border-b-2 border-transparent transition-colors"
            >
              Mon profil
            </button>
          </nav>
        </div>
      </div>

      {/* ════════════════════════════════════════
          CONTENT
      ════════════════════════════════════════ */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 lg:px-10 py-8">

        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-navy mb-1">Mes réservations</h1>
          <p className="text-sm text-gray-400">
            Retrouvez vos prochaines leçons et consultez votre historique.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setActiveFilter(f.key)}
              className={`text-sm font-medium px-4 py-2 rounded-full border transition-colors ${
                activeFilter === f.key
                  ? "bg-navy text-white border-navy"
                  : "bg-white text-gray-600 border-gray-200 hover:border-navy/30 hover:text-navy"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {isEmpty ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-10">

            {/* Upcoming */}
            {filteredUpcoming.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                  Prochaines réservations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredUpcoming.map((b) => (
                    <UpcomingBookingCard key={b.id} booking={b} />
                  ))}
                </div>
              </section>
            )}

            {/* History */}
            {filteredPast.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                  Historique
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPast.map((b) => (
                    <PastBookingCard key={b.id} booking={b} />
                  ))}
                </div>
              </section>
            )}

          </div>
        )}
      </div>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
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

    </main>
  );
}
