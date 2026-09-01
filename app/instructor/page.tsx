import Image from "next/image";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════ */

function IconArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════ */

const benefits = [
  {
    icon: <IconUser />,
    title: "Présentez votre profil",
    description:
      "Mettez en avant votre expérience, vos spécialités et vos disponibilités pour attirer les bons élèves.",
  },
  {
    icon: <IconStar />,
    title: "Recevez des demandes d'élèves",
    description:
      "Les apprenants vous contactent directement selon vos créneaux. Acceptez les demandes à votre rythme.",
  },
  {
    icon: <IconCalendar />,
    title: "Gérez vos réservations",
    description:
      "Suivez vos leçons à venir, consultez votre historique et organisez votre emploi du temps simplement.",
  },
] as const;

const checkpoints = [
  "Inscription gratuite",
  "Profil visible par les apprenants",
  "Aucun engagement",
  "Disponibilités flexibles",
] as const;

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */

export default function InstructorLandingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white">

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
          <nav className="flex items-center gap-2 sm:gap-6">
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
          HERO
      ════════════════════════════════════════ */}
      <section className="bg-surface border-b border-gray-100 px-6 pt-16 pb-14">
        <div className="max-w-3xl mx-auto text-center">

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-navy/8 text-navy text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-navy" />
            Espace moniteur
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-navy leading-[1.1] tracking-tight mb-5">
            Développez votre activité<br className="hidden sm:block" /> avec Drive-Path.
          </h1>
          <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto leading-relaxed mb-10">
            Présentez votre profil, recevez des demandes d&apos;élèves et gérez vos réservations —
            tout en gardant le contrôle de votre agenda.
          </p>

          {/* CTA cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">

            {/* Existing instructor */}
            <div className="flex flex-col items-start p-7 rounded-3xl bg-white border-2 border-gray-100 hover:border-navy/20 hover:shadow-lg transition-all duration-200 text-left group">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Déjà inscrit
              </p>
              <h2 className="text-lg font-bold text-navy leading-snug mb-2">
                Je suis déjà moniteur
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                Accédez à votre espace pour gérer vos leçons et votre profil.
              </p>
              <Link
                href="/login"
                className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-navy border-2 border-navy px-5 py-2.5 rounded-full hover:bg-navy hover:text-white transition-all duration-150 group-hover:gap-3"
              >
                Se connecter
                <IconArrowRight />
              </Link>
            </div>

            {/* New instructor */}
            <div className="flex flex-col items-start p-7 rounded-3xl bg-navy text-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-left group">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
                Nouveau sur Drive-Path
              </p>
              <h2 className="text-lg font-bold leading-snug mb-2">
                Je souhaite devenir moniteur
              </h2>
              <p className="text-sm text-white/55 leading-relaxed mb-6">
                Créez votre profil gratuitement et commencez à recevoir des demandes d&apos;élèves.
              </p>
              <Link
                href="/instructor/account"
                className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-navy bg-white px-5 py-2.5 rounded-full hover:bg-white/90 transition-all duration-150 group-hover:gap-3"
              >
                Créer mon profil
                <IconArrowRight />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          BENEFITS
      ════════════════════════════════════════ */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-3">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
              Drive-Path facilite la mise en relation entre moniteurs et apprenants,
              sans complexité.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="flex flex-col items-start p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="w-11 h-11 rounded-xl bg-navy/5 flex items-center justify-center text-navy mb-4 flex-shrink-0">
                  {b.icon}
                </div>
                <h3 className="font-bold text-navy mb-2 leading-snug">{b.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          TRUST STRIP
      ════════════════════════════════════════ */}
      <section className="bg-surface border-t border-gray-100 py-10 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-6">
            Pourquoi Drive-Path ?
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {checkpoints.map((label) => (
              <div
                key={label}
                className="flex items-center gap-2.5 text-sm font-medium text-gray-700"
              >
                <div className="w-5 h-5 rounded-full bg-green-dp/10 text-green-dp flex items-center justify-center flex-shrink-0">
                  <IconCheck />
                </div>
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer className="bg-white border-t border-gray-100 px-6 py-8">
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
