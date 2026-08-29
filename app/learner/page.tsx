import Image from "next/image";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════
   ICONS (inline SVG — no external dependency)
═══════════════════════════════════════════════════════════ */

function IconMapPin() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconStarFilled() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"
      stroke="#F59E0B" strokeWidth="1" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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

function IconChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   STAR RATING
═══════════════════════════════════════════════════════════ */

function StarRating({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) =>
        n <= filled ? (
          <IconStarFilled key={n} />
        ) : (
          <svg key={n} width="13" height="13" viewBox="0 0 24 24"
            fill="#E5E7EB" stroke="#E5E7EB" strokeWidth="1" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        )
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MOCK DATA — démonstration uniquement, aucune base de données
═══════════════════════════════════════════════════════════ */

const mockInstructors = [
  {
    id: "thomas-m",
    initials: "TM",
    avatarBg: "bg-navy",
    name: "Thomas M.",
    city: "Lyon 3e",
    rating: 4.8,
    reviews: 47,
    price: 45,
    experience: "10 ans d'expérience",
    tags: ["Boîte manuelle", "Conduite accompagnée"],
    availability: "Disponible le week-end",
  },
  {
    id: "sophie-l",
    initials: "SL",
    avatarBg: "bg-green-dp",
    name: "Sophie L.",
    city: "Marseille 8e",
    rating: 4.9,
    reviews: 82,
    price: 50,
    experience: "8 ans d'expérience",
    tags: ["Boîte automatique", "Code de la route"],
    availability: "Cours en soirée disponibles",
  },
  {
    id: "karim-b",
    initials: "KB",
    avatarBg: "bg-[#5B7FA6]",
    name: "Karim B.",
    city: "Paris 15e",
    rating: 4.7,
    reviews: 31,
    price: 42,
    experience: "5 ans d'expérience",
    tags: ["Boîte manuelle", "Débutants bienvenus"],
    availability: "Grande flexibilité horaire",
  },
] as const;

const filters = ["Distance", "Tarif", "Disponibilité", "Évaluation"] as const;

/* ═══════════════════════════════════════════════════════════
   INSTRUCTOR CARD
═══════════════════════════════════════════════════════════ */

function InstructorCard({
  id,
  initials,
  avatarBg,
  name,
  city,
  rating,
  reviews,
  price,
  experience,
  tags,
  availability,
}: (typeof mockInstructors)[number]) {
  return (
    <article className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Card body */}
      <div className="flex flex-col flex-1 p-6">

        {/* Top row: avatar + verified badge */}
        <div className="flex items-start justify-between mb-5">
          <div
            className={`${avatarBg} w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg tracking-wide flex-shrink-0`}
          >
            {initials}
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-dp bg-green-dp/10 px-2.5 py-1 rounded-full">
            <IconShieldCheck />
            Moniteur vérifié
          </span>
        </div>

        {/* Name + city */}
        <h3 className="text-lg font-bold text-navy leading-tight">{name}</h3>
        <p className="text-sm text-gray-400 mb-3">{city}</p>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-2">
          <StarRating rating={rating} />
          <span className="text-sm font-semibold text-navy">{rating}</span>
          <span className="text-xs text-gray-400">({reviews} avis)</span>
        </div>

        {/* Experience + availability */}
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
          {experience} · {availability}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2.5 py-1 rounded-full bg-surface text-gray-600 font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Footer: price + CTA */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-navy">{price}€</span>
            <span className="text-xs text-gray-400">/heure</span>
          </div>
          <Link
            href={`/profile/${id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-navy px-4 py-2 rounded-full hover:bg-navy-dark transition-colors"
          >
            Voir le profil
            <IconArrowRight />
          </Link>
        </div>

      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */

export default function LearnerPage() {
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
          HERO + SEARCH
      ════════════════════════════════════════ */}
      <section className="bg-surface px-6 pt-16 pb-12">
        <div className="max-w-3xl mx-auto text-center">

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-navy leading-[1.1] tracking-tight mb-4">
            Trouvez le moniteur<br />qui vous correspond.
          </h1>
          <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto leading-relaxed mb-10">
            Découvrez des moniteurs de conduite et choisissez celui qui correspond
            à vos besoins, votre rythme et vos disponibilités.
          </p>

          {/* Search card */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">

              {/* Location */}
              <div className="flex-1 flex items-center gap-3 bg-surface rounded-xl px-4 py-3">
                <span className="text-gray-400 flex-shrink-0">
                  <IconMapPin />
                </span>
                <div className="flex-1 text-left">
                  <label className="block text-xs font-semibold text-navy mb-0.5">
                    Localisation
                  </label>
                  <input
                    type="text"
                    placeholder="Ville ou code postal"
                    className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px bg-gray-100 self-stretch" />

              {/* Date */}
              <div className="flex-1 flex items-center gap-3 bg-surface rounded-xl px-4 py-3">
                <span className="text-gray-400 flex-shrink-0">
                  <IconCalendar />
                </span>
                <div className="flex-1 text-left">
                  <label className="block text-xs font-semibold text-navy mb-0.5">
                    Disponibilité
                  </label>
                  <input
                    type="text"
                    placeholder="Quand souhaitez-vous conduire ?"
                    className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                  />
                </div>
              </div>

              {/* Search button */}
              <button
                type="button"
                className="flex items-center justify-center gap-2 bg-navy text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-navy-dark transition-colors flex-shrink-0"
              >
                <IconSearch />
                Rechercher
              </button>

            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FILTERS + RESULTS
      ════════════════════════════════════════ */}
      <section className="flex-1 px-6 py-10">
        <div className="max-w-6xl mx-auto">

          {/* Filters bar */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <span className="text-sm font-medium text-gray-500 mr-1">Filtrer par :</span>
            {filters.map((label) => (
              <button
                key={label}
                type="button"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-full hover:border-navy/30 hover:text-navy transition-colors cursor-pointer"
              >
                {label}
                <IconChevronDown />
              </button>
            ))}

            {/* Result count */}
            <span className="ml-auto text-sm text-gray-400">
              3 moniteurs trouvés
            </span>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockInstructors.map((instructor) => (
              <InstructorCard key={instructor.name} {...instructor} />
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
            <Link href="#" className="hover:text-gray-600 transition-colors">Conditions d&apos;utilisation</Link>
            <Link href="#" className="hover:text-gray-600 transition-colors">Contact</Link>
          </nav>
        </div>
      </footer>

    </main>
  );
}
