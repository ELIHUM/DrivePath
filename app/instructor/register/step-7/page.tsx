"use client";

import { useState } from "react";
import Link from "next/link";
import { loadAll } from "../_store";
import { PageShell, StepProgress, IconArrowLeft } from "../_shared";

/* ═══════════════════════════════════════════════════════════
   SUMMARY SECTION
═══════════════════════════════════════════════════════════ */

function SummaryCard({
  title, children,
}: {
  title: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">{title}</h3>
      <dl className="flex flex-col gap-2.5">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{label}</dt>
      <dd className="text-sm font-medium text-navy text-right">{value}</dd>
    </div>
  );
}

function TagList({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((t) => (
          <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-surface text-navy font-medium">{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SUCCESS SCREEN
═══════════════════════════════════════════════════════════ */

function SuccessScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-24 h-24 rounded-full bg-green-dp/10 flex items-center justify-center text-green-dp mb-6">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-navy mb-3">Candidature envoyée !</h1>
      <p className="text-sm text-gray-400 max-w-sm leading-relaxed mb-10">
        Notre équipe examinera votre profil et vous contactera prochainement
        pour finaliser votre inscription.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/instructor"
          className="inline-flex items-center justify-center bg-navy text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-navy-dark transition-colors"
        >
          Retour à l&apos;espace moniteur
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center text-sm font-medium text-gray-500 hover:text-navy transition-colors px-6 py-3"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */

export default function RegisterStep7() {
  const [data] = useState(() => loadAll());
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { step1, step2, step3, step4, step5, step6 } = data;

  const gearboxLabel = step5.gearbox === "manual" ? "Boîte manuelle"
    : step5.gearbox === "automatic" ? "Boîte automatique" : "";

  const availabilityLabel = [
    step6.morning && "Matin", step6.afternoon && "Après-midi", step6.evening && "Soirée"
  ].filter(Boolean).join(", ") || "—";

  const dayLabels: Record<string, string> = {
    lun: "Lundi", mar: "Mardi", mer: "Mercredi",
    jeu: "Jeudi", ven: "Vendredi", sam: "Samedi", dim: "Dimanche",
  };
  const daysLabel = step6.days.map((d) => dayLabels[d]).join(", ") || "—";

  if (isSubmitted) {
    return (
      <PageShell>
        <SuccessScreen />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy mb-2">Créer votre profil de moniteur</h1>
        <p className="text-sm text-gray-400">Vérifiez vos informations avant de soumettre votre candidature.</p>
      </div>

      <StepProgress currentStep={6} />

      <div className="flex flex-col gap-4">

        <SummaryCard title="Informations personnelles">
          <Row label="Prénom"       value={step1.firstName} />
          <Row label="Nom"          value={step1.lastName} />
          <Row label="Courriel"     value={step1.email} />
          <Row label="Téléphone"    value={step1.phone} />
          <Row label="Naissance"    value={step1.birthDate} />
        </SummaryCard>

        <SummaryCard title="Adresse">
          <Row label="Adresse"      value={[step2.street, step2.complement].filter(Boolean).join(", ")} />
          <Row label="Ville"        value={step2.city} />
          <Row label="Code postal"  value={step2.postalCode} />
          <Row label="Province"      value={step2.province} />
          <Row label="Zone d'activité" value={step2.activityRadius ? `${step2.activityRadius} km` : undefined} />
        </SummaryCard>

        <SummaryCard title="Profil professionnel">
          <Row label="Statut"        value={step3.status} />
          <Row label="Permis / licence" value={step3.certificationNumber} />
          <Row label="Expérience"   value={step3.yearsExperience ? `${step3.yearsExperience} an${Number(step3.yearsExperience) > 1 ? "s" : ""}` : undefined} />
          {step3.specialties.length > 0 && (
            <TagList label="Spécialités" items={step3.specialties} />
          )}
          {step3.bio && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400">Présentation</span>
              <p className="text-sm text-navy leading-relaxed">{step3.bio}</p>
            </div>
          )}
        </SummaryCard>

        <SummaryCard title="Services & tarifs">
          {step4.lessonTypes.length > 0 && (
            <TagList label="Types de leçons" items={step4.lessonTypes} />
          )}
          <Row label="Tarif horaire"  value={step4.pricePerHour ? `${step4.pricePerHour} $/h` : undefined} />
          {step4.durations.length > 0 && (
            <TagList label="Durées proposées" items={step4.durations} />
          )}
          {step4.packages && step4.packages.length > 0 && (
            <TagList label="Forfaits" items={step4.packages} />
          )}
        </SummaryCard>

        <SummaryCard title="Véhicule">
          <Row label="Marque"       value={step5.brand} />
          <Row label="Modèle"       value={step5.model} />
          <Row label="Année"        value={step5.year} />
          <Row label="Boîte"        value={gearboxLabel} />
          <Row label="Couleur"      value={step5.color} />
        </SummaryCard>

        <SummaryCard title="Disponibilités">
          <Row label="Jours"         value={daysLabel} />
          <Row label="Plages horaires" value={availabilityLabel} />
        </SummaryCard>

      </div>

      {/* Navigation */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 mt-6">
        <Link
          href="/instructor/register/step-6"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-navy transition-colors px-2 py-2"
        >
          <IconArrowLeft />
          Retour
        </Link>
        <button
          type="button"
          onClick={() => setIsSubmitted(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-green-dp text-white text-sm font-semibold px-8 py-3 rounded-xl hover:bg-green-dp/90 transition-colors shadow-sm"
        >
          Soumettre ma candidature
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center mt-5 leading-relaxed max-w-sm mx-auto">
        En soumettant, vous confirmez que les informations renseignées sont exactes.
        Drive-Path vérifiera votre agrément avant activation de votre profil.
      </p>
    </PageShell>
  );
}
