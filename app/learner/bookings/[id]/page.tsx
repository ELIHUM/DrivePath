"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getBookingById, type BookingStatus } from "../_data";

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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconShieldCheck() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
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
   DETAIL ROW (label + value)
═══════════════════════════════════════════════════════════ */

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{label}</span>
      <span className="text-sm font-medium text-navy text-right">{value}</span>
    </div>
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
   STATUS LABEL
═══════════════════════════════════════════════════════════ */

function statusLabel(status: BookingStatus): string {
  const map: Record<BookingStatus, string> = {
    confirmed: "Confirmée",
    pending:   "En attente de confirmation",
    completed: "Terminée",
    cancelled: "Annulée",
  };
  return map[status];
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */

export default function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const booking = getBookingById(id);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelledLocally, setIsCancelledLocally] = useState(false);

  /* ── Shared header / footer ─────────────────── */
  const Header = () => (
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
  );

  const LearnerNav = () => (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-6 lg:px-10">
        <nav className="flex gap-6 sm:gap-8" aria-label="Espace apprenant">
          <Link
            href="/learner"
            className="text-sm font-medium text-gray-500 hover:text-navy py-3.5 border-b-2 border-transparent transition-colors"
          >
            Trouver un moniteur
          </Link>
          <Link
            href="/learner/bookings"
            className="text-sm font-semibold text-navy py-3.5 border-b-2 border-navy"
          >
            Mes réservations
          </Link>
          <button
            type="button"
            className="text-sm font-medium text-gray-500 hover:text-navy py-3.5 border-b-2 border-transparent transition-colors"
          >
            Mon profil
          </button>
        </nav>
      </div>
    </div>
  );

  const Footer = () => (
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

  /* ── Not found ──────────────────────────────── */
  if (!booking) {
    return (
      <main className="flex min-h-screen flex-col bg-white">
        <Header />
        <LearnerNav />
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
          <h1 className="text-2xl font-bold text-navy mb-3">Réservation introuvable</h1>
          <p className="text-sm text-gray-400 mb-8 max-w-xs leading-relaxed">
            Cette réservation n&apos;existe pas ou a été supprimée.
          </p>
          <Link
            href="/learner/bookings"
            className="inline-flex items-center gap-2 bg-navy text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-navy-dark transition-colors"
          >
            <IconArrowLeft />
            Retour à mes réservations
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  /* ── Derived state ──────────────────────────── */
  const effectiveStatus: BookingStatus = isCancelledLocally ? "cancelled" : booking.status;
  const canCancel =
    !isCancelledLocally &&
    (booking.status === "confirmed" || booking.status === "pending");

  const handleCancel = () => {
    setIsCancelledLocally(true);
    setShowCancelConfirm(false);
  };

  /* ════════════════════════════════════════════
     DETAIL VIEW
  ════════════════════════════════════════════ */
  return (
    <main className="flex min-h-screen flex-col bg-surface">
      <Header />
      <LearnerNav />

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 lg:px-10 py-8">

        {/* Back + heading */}
        <div className="mb-6">
          <Link
            href="/learner/bookings"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-navy transition-colors mb-4"
          >
            <IconArrowLeft />
            Retour à mes réservations
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-navy">Détails de la réservation</h1>
            <StatusBadge status={effectiveStatus} />
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">

          {/* ── Left: details ── */}
          <div className="flex flex-col gap-5">

            {/* Instructor */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                Moniteur
              </h2>
              <div className="flex items-center gap-4">
                <div
                  className={`${booking.instructorAvatarBg} w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0`}
                >
                  {booking.instructorInitials}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-navy">{booking.instructorName}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-dp bg-green-dp/10 px-2 py-0.5 rounded-full">
                      <IconShieldCheck />
                      Moniteur vérifié
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    <InfoRow icon={<IconMapPin />} text={booking.instructorCity} />
                  </div>
                </div>
              </div>
            </div>

            {/* Lesson details */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                Détails de la leçon
              </h2>
              <div className="flex flex-col">
                <DetailRow label="Date"         value={booking.dateLabel} />
                <DetailRow label="Heure"        value={`${booking.timeStart} — ${booking.timeEnd}`} />
                <DetailRow label="Durée"        value={booking.duration} />
                <DetailRow label="Type"         value={booking.lessonType} />
                <DetailRow label="Lieu"         value={booking.instructorCity} />
                <DetailRow label="Prix"         value={`${booking.price} $`} />
                <DetailRow label="Statut"       value={statusLabel(effectiveStatus)} />
              </div>
            </div>

            {/* Upcoming info rows for context */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                Récapitulatif rapide
              </h2>
              <div className="flex flex-col gap-3">
                <InfoRow icon={<IconCalendar />} text={booking.dateLabel} />
                <InfoRow icon={<IconClock />}    text={`${booking.timeStart} — ${booking.timeEnd} · ${booking.duration}`} />
                <InfoRow icon={<IconMapPin />}   text={`${booking.lessonType} · ${booking.instructorCity}`} />
              </div>
            </div>

            {/* À savoir */}
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

          {/* ── Right: actions ── */}
          <div className="lg:sticky lg:top-24 lg:self-start flex flex-col gap-4">

            {/* Price summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-navy mb-4">Récapitulatif</h2>
              <div className="flex items-baseline justify-between pt-3 border-t border-gray-100">
                <span className="text-sm font-semibold text-navy">Total</span>
                <span className="text-2xl font-bold text-navy">{booking.price} $</span>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">

              <Link
                href={`/profile/${booking.instructorId}`}
                className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-navy py-3 rounded-xl hover:bg-navy-dark transition-colors"
              >
                Voir le profil du moniteur
                <IconArrowRight />
              </Link>

              <button
                type="button"
                className="w-full inline-flex items-center justify-center gap-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 py-3 rounded-xl hover:border-navy/30 hover:text-navy transition-colors"
              >
                Contacter le moniteur
              </button>

              {/* Cancel */}
              {canCancel && !showCancelConfirm && (
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full inline-flex items-center justify-center text-sm font-medium text-red-500 hover:text-red-700 py-2.5 transition-colors"
                >
                  Annuler la réservation
                </button>
              )}

              {canCancel && showCancelConfirm && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-sm text-red-700 font-medium mb-3 text-center leading-snug">
                    Voulez-vous vraiment annuler cette réservation ?
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
                    >
                      Oui, annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(false)}
                      className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-navy transition-colors"
                    >
                      Non, garder
                    </button>
                  </div>
                </div>
              )}

              {isCancelledLocally && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    La réservation a été annulée pour cette session.
                  </p>
                </div>
              )}

            </div>

          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
