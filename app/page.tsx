import Image from "next/image";
import Link from "next/link";

/* ── Inline SVG icons (no external dependency) ─────────── */

function IconGraduation() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3.5 3 8.5 3 12 0v-5" />
    </svg>
  );
}

function IconSteering() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 9V3" />
      <path d="M9.35 14.65L5 19" />
      <path d="M14.65 14.65L19 19" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

/* ── Value prop data ────────────────────────────────────── */

const features = [
  {
    title: "Moniteurs agréés",
    description: "Chaque moniteur est certifié, vérifié et évalué par notre équipe.",
  },
  {
    title: "À votre rythme",
    description: "Planifiez vos leçons selon vos disponibilités, sans contraintes.",
  },
  {
    title: "Suivi personnalisé",
    description: "Progressez avec un programme adapté à votre niveau et vos objectifs.",
  },
] as const;

/* ── Page ───────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-white">

      {/* ════════════════════════════════════════
          HEADER
      ════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 flex items-center justify-between h-16">

          {/* Logo */}
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

          {/* Nav */}
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
      <section className="flex flex-col items-center justify-center flex-1 px-6 pt-20 pb-20 text-center">

        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 bg-green-dp/8 text-green-dp text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-10">
          <span className="w-1.5 h-1.5 rounded-full bg-green-dp" />
          Plateforme de conduite
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-navy leading-[1.08] tracking-tight mb-6 max-w-3xl">
          Votre chemin<br />vers la liberté.
        </h1>

        {/* Sub-headline */}
        <p className="text-base sm:text-lg text-gray-500 max-w-md leading-relaxed mb-16">
          Drive-Path met en relation apprenants et moniteurs agréés
          pour des leçons de conduite adaptées à votre rythme.
        </p>

        {/* ── CTA Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">

          {/* Card — Apprenant */}
          <Link
            href="/learner"
            className="group flex flex-col items-start gap-0 p-8 rounded-3xl bg-navy text-white
                       shadow-md hover:shadow-xl hover:-translate-y-1
                       transition-all duration-200 ease-out text-left"
          >
            {/* Icon bubble */}
            <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 mb-6 group-hover:bg-white/20 transition-colors">
              <IconGraduation />
            </div>

            <h2 className="text-xl font-bold leading-snug mb-3">
              Je veux apprendre<br />à conduire
            </h2>
            <p className="text-white/55 text-sm leading-relaxed mb-8">
              Trouvez un moniteur agréé près de chez vous et réservez vos leçons en quelques clics.
            </p>

            <div className="mt-auto flex items-center gap-2 text-sm font-semibold text-white/70 group-hover:text-white group-hover:gap-3 transition-all duration-150">
              Commencer <IconArrowRight />
            </div>
          </Link>

          {/* Card — Moniteur */}
          <Link
            href="/login"
            className="group flex flex-col items-start gap-0 p-8 rounded-3xl bg-white text-navy
                       border-2 border-gray-100 hover:border-navy/20 hover:shadow-xl hover:-translate-y-1
                       transition-all duration-200 ease-out text-left"
          >
            {/* Icon bubble */}
            <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-navy/5 mb-6 group-hover:bg-navy/10 transition-colors">
              <IconSteering />
            </div>

            <h2 className="text-xl font-bold leading-snug mb-3">
              Je suis<br />moniteur
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Proposez vos leçons, gérez votre planning et développez votre activité en toute autonomie.
            </p>

            <div className="mt-auto flex items-center gap-2 text-sm font-semibold text-navy/50 group-hover:text-navy group-hover:gap-3 transition-all duration-150">
              Me connecter <IconArrowRight />
            </div>
          </Link>

        </div>
      </section>

      {/* ════════════════════════════════════════
          VALUE PROPS
      ════════════════════════════════════════ */}
      <section className="bg-surface border-t border-gray-100 py-14 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10">
          {features.map(({ title, description }) => (
            <div key={title} className="flex flex-col items-center text-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-full bg-green-dp/10 text-green-dp flex-shrink-0">
                <IconCheck />
              </div>
              <div>
                <h3 className="font-semibold text-navy mb-1">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
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
            <Link href="#" className="hover:text-gray-600 transition-colors">
              Confidentialité
            </Link>
            <Link href="#" className="hover:text-gray-600 transition-colors">
              Conditions d&apos;utilisation
            </Link>
            <Link href="#" className="hover:text-gray-600 transition-colors">
              Contact
            </Link>
          </nav>
        </div>
      </footer>

    </main>
  );
}
