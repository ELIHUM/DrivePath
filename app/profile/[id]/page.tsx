import Image from "next/image";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════ */

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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function IconArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function IconMessageCircle() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconCalendarCheck() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <polyline points="9 16 11 18 15 14" />
    </svg>
  );
}


/* ═══════════════════════════════════════════════════════════
   COMPONENTS
═══════════════════════════════════════════════════════════ */

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const filled = Math.round(rating);
  const iconSize = size === "md" ? 18 : 14;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) =>
        n <= filled ? (
          <svg key={n} width={iconSize} height={iconSize} viewBox="0 0 24 24"
            fill="#F59E0B" stroke="#F59E0B" strokeWidth="1" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ) : (
          <svg key={n} width={iconSize} height={iconSize} viewBox="0 0 24 24"
            fill="#E5E7EB" stroke="#E5E7EB" strokeWidth="1" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        )
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MOCK DATA
   Données fictives — remplacer par une vraie base de données
   dans une étape future (lib/database).
═══════════════════════════════════════════════════════════ */

type DaySlot = {
  day: string;
  full: string;
  slots: string | null;
};

type Review = {
  author: string;
  rating: number;
  date: string;
  comment: string;
};

type InstructorProfile = {
  initials: string;
  avatarBg: string;
  name: string;
  city: string;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  studentsCount: number;
  satisfactionRate: number;
  price: number;
  tags: string[];
  about: string;
  availability: DaySlot[];
  reviews: Review[];
};

const MOCK_PROFILES: Record<string, InstructorProfile> = {
  "thomas-m": {
    initials: "TM",
    avatarBg: "bg-navy",
    name: "Thomas M.",
    city: "Lyon 3e",
    rating: 4.8,
    reviewCount: 47,
    yearsExperience: 10,
    studentsCount: 150,
    satisfactionRate: 98,
    price: 45,
    tags: [
      "Boîte manuelle",
      "Boîte automatique",
      "Débutants",
      "Perfectionnement",
      "Code de la route",
      "Conduite accompagnée",
    ],
    about:
      "Moniteur agréé depuis 10 ans, je mets un point d'honneur à adapter chaque leçon au rythme et au niveau de mon élève. Mon objectif est simple : vous donner confiance au volant dans les meilleures conditions de sécurité.\n\nJ'ai accompagné plus de 150 élèves à travers l'ensemble de leur parcours, du premier cours à l'obtention du permis. Que vous soyez grand débutant ou que vous cherchiez à perfectionner votre conduite, je vous proposerai un accompagnement personnalisé et bienveillant.",
    availability: [
      { day: "Lun", full: "Lundi", slots: "09:00 – 18:00" },
      { day: "Mar", full: "Mardi", slots: "09:00 – 18:00" },
      { day: "Mer", full: "Mercredi", slots: "14:00 – 19:00" },
      { day: "Jeu", full: "Jeudi", slots: null },
      { day: "Ven", full: "Vendredi", slots: null },
      { day: "Sam", full: "Samedi", slots: "09:00 – 16:00" },
      { day: "Dim", full: "Dimanche", slots: null },
    ],
    reviews: [
      {
        author: "Camille R.",
        rating: 5,
        date: "Juillet 2026",
        comment:
          "Thomas est très patient et explique vraiment bien. J'ai beaucoup progressé en quelques semaines. Je recommande vivement !",
      },
      {
        author: "Mehdi T.",
        rating: 5,
        date: "Juin 2026",
        comment:
          "Excellent moniteur, très pédagogue. Il sait mettre à l'aise même les plus stressés. Grâce à lui, j'ai décroché mon permis du premier coup.",
      },
      {
        author: "Julie M.",
        rating: 4,
        date: "Mai 2026",
        comment:
          "Très bon moniteur, à l'écoute et professionnel. Les cours sont bien structurés et adaptés à mon niveau.",
      },
    ],
  },

  "sophie-l": {
    initials: "SL",
    avatarBg: "bg-green-dp",
    name: "Sophie L.",
    city: "Marseille 8e",
    rating: 4.9,
    reviewCount: 82,
    yearsExperience: 8,
    studentsCount: 200,
    satisfactionRate: 99,
    price: 50,
    tags: [
      "Boîte automatique",
      "Code de la route",
      "Débutants",
      "Conduite en ville",
      "Anxiété au volant",
    ],
    about:
      "Monitrice agréée depuis 8 ans, je me spécialise dans l'accompagnement des apprenants anxieux ou en échec répété. Ma pédagogie douce et progressive a permis à plus de 200 élèves de retrouver confiance au volant.\n\nJe propose des cours en journée et en soirée pour s'adapter à votre planning. L'objectif est que vous vous sentiez à l'aise et en sécurité à chaque leçon.",
    availability: [
      { day: "Lun", full: "Lundi", slots: "10:00 – 20:00" },
      { day: "Mar", full: "Mardi", slots: "10:00 – 20:00" },
      { day: "Mer", full: "Mercredi", slots: null },
      { day: "Jeu", full: "Jeudi", slots: "10:00 – 20:00" },
      { day: "Ven", full: "Vendredi", slots: "14:00 – 20:00" },
      { day: "Sam", full: "Samedi", slots: "09:00 – 14:00" },
      { day: "Dim", full: "Dimanche", slots: null },
    ],
    reviews: [
      {
        author: "Léa D.",
        rating: 5,
        date: "Août 2026",
        comment:
          "Sophie est une perle. J'avais beaucoup d'appréhension et elle a su me mettre en confiance dès la première leçon. Permis obtenu !",
      },
      {
        author: "Antoine V.",
        rating: 5,
        date: "Juillet 2026",
        comment:
          "Pédagogie exceptionnelle, très professionnelle et disponible. Je recommande sans hésitation.",
      },
      {
        author: "Sara K.",
        rating: 5,
        date: "Juin 2026",
        comment:
          "Grâce à Sophie, j'ai surmonté ma phobie du volant. Incroyable patience et bienveillance.",
      },
    ],
  },

  "karim-b": {
    initials: "KB",
    avatarBg: "bg-[#5B7FA6]",
    name: "Karim B.",
    city: "Paris 15e",
    rating: 4.7,
    reviewCount: 31,
    yearsExperience: 5,
    studentsCount: 75,
    satisfactionRate: 95,
    price: 42,
    tags: [
      "Boîte manuelle",
      "Débutants bienvenus",
      "Conduite en ville",
      "Autoroute",
      "Perfectionnement",
    ],
    about:
      "Moniteur agréé depuis 5 ans, je propose des leçons adaptées à tous les profils dans Paris et sa petite couronne. Flexible sur les horaires, je m'adapte à votre emploi du temps.\n\nJe travaille avec une approche bienveillante et pragmatique : chaque leçon est construite en fonction de vos besoins réels, pas d'un programme figé.",
    availability: [
      { day: "Lun", full: "Lundi", slots: "08:00 – 19:00" },
      { day: "Mar", full: "Mardi", slots: null },
      { day: "Mer", full: "Mercredi", slots: "08:00 – 19:00" },
      { day: "Jeu", full: "Jeudi", slots: "08:00 – 19:00" },
      { day: "Ven", full: "Vendredi", slots: "08:00 – 17:00" },
      { day: "Sam", full: "Samedi", slots: "09:00 – 13:00" },
      { day: "Dim", full: "Dimanche", slots: null },
    ],
    reviews: [
      {
        author: "Yasmine O.",
        rating: 5,
        date: "Août 2026",
        comment:
          "Karim est très professionnel et s'adapte bien au niveau de chacun. Très satisfaite de mes leçons.",
      },
      {
        author: "Nicolas F.",
        rating: 4,
        date: "Juillet 2026",
        comment:
          "Bon moniteur, disponible et pédagogue. Les leçons sont bien menées, je progresse à chaque cours.",
      },
      {
        author: "Amira S.",
        rating: 5,
        date: "Juin 2026",
        comment:
          "Très patient et à l'écoute. Il sait s'adapter au rythme de son élève. Je recommande.",
      },
    ],
  },
};

function getProfile(id: string): InstructorProfile {
  return MOCK_PROFILES[id] ?? MOCK_PROFILES["thomas-m"];
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */

export default async function InstructorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = getProfile(id);

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

      {/* ════════════════════════════════════════
          CONTENT
      ════════════════════════════════════════ */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 lg:px-10 py-8">

        {/* Back button */}
        <Link
          href="/learner"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-navy transition-colors mb-8"
        >
          <IconArrowLeft />
          Retour aux moniteurs
        </Link>

        {/* ── Profile header card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">

            {/* Avatar */}
            <div
              className={`${profile.avatarBg} w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl tracking-wide flex-shrink-0`}
            >
              {profile.initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-navy">
                  {profile.name}
                </h1>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-dp bg-green-dp/10 px-3 py-1 rounded-full">
                  <IconShieldCheck />
                  Moniteur vérifié
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-gray-400 text-sm mb-3">
                <IconMapPin />
                {profile.city}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <StarRating rating={profile.rating} size="md" />
                  <span className="font-bold text-navy">{profile.rating}</span>
                  <span className="text-sm text-gray-400">
                    ({profile.reviewCount} avis)
                  </span>
                </div>
                <span className="text-sm text-gray-400">
                  {profile.yearsExperience} ans d&apos;expérience
                </span>
              </div>
            </div>

            {/* Quick stats — desktop */}
            <div className="hidden lg:flex items-center gap-6 flex-shrink-0 border-l border-gray-100 pl-8">
              {[
                { value: `${profile.yearsExperience} ans`, label: "d'expérience" },
                { value: `${profile.studentsCount}+`, label: "élèves accompagnés" },
                { value: `${profile.satisfactionRate}%`, label: "de satisfaction" },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="text-xl font-bold text-navy">{value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

          </div>

          {/* Quick stats — mobile/tablet */}
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-100 lg:hidden">
            {[
              { value: `${profile.yearsExperience} ans`, label: "d'expérience" },
              { value: `${profile.studentsCount}+`, label: "élèves" },
              { value: `${profile.satisfactionRate}%`, label: "satisfaction" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center flex-1">
                <div className="text-lg font-bold text-navy">{value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">

          {/* ── Main column ── */}
          <div className="flex flex-col gap-8">

            {/* About */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <h2 className="text-lg font-bold text-navy mb-4">À propos de moi</h2>
              <div className="space-y-4">
                {profile.about.split("\n\n").map((paragraph, i) => (
                  <p key={i} className="text-gray-600 leading-relaxed text-sm sm:text-base">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>

            {/* Specialties */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <h2 className="text-lg font-bold text-navy mb-4">Mes spécialités</h2>
              <div className="flex flex-wrap gap-2">
                {profile.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-sm font-medium text-navy bg-navy/5 px-4 py-2 rounded-full border border-navy/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            {/* Availability */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <h2 className="text-lg font-bold text-navy mb-2">Mes disponibilités</h2>
              <p className="text-sm text-gray-400 mb-6">
                Plages horaires indicatives — la réservation sera disponible prochainement.
              </p>

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {profile.availability.map(({ day, full, slots }) => (
                  <div
                    key={day}
                    title={full}
                    className={`rounded-xl p-3 text-center ${
                      slots
                        ? "bg-navy/5 border border-navy/10"
                        : "bg-gray-50 border border-gray-100"
                    }`}
                  >
                    <div
                      className={`text-xs font-bold mb-2 ${
                        slots ? "text-navy" : "text-gray-300"
                      }`}
                    >
                      {day}
                    </div>
                    {slots ? (
                      <div className="text-xs text-gray-600 leading-snug">
                        {slots.split(" – ").map((t, i) => (
                          <div key={i}>{t}</div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-300">—</div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Reviews */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-navy">Avis des élèves</h2>
                <div className="flex items-center gap-2">
                  <StarRating rating={profile.rating} />
                  <span className="text-sm font-semibold text-navy">{profile.rating}</span>
                  <span className="text-sm text-gray-400">({profile.reviewCount} avis)</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {profile.reviews.map((review, i) => (
                  <div
                    key={i}
                    className="bg-surface rounded-xl p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <StarRating rating={review.rating} />
                      <span className="text-xs text-gray-400">{review.date}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed mb-3 italic">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                    <p className="text-xs font-semibold text-gray-500">— {review.author}</p>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* ── Sidebar ── */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">

            {/* Pricing card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-navy">{profile.price}€</span>
                <span className="text-sm text-gray-400">/heure</span>
              </div>
              <p className="text-xs text-gray-400 mb-6">
                Première leçon d&apos;évaluation disponible
              </p>

              {/* Action buttons */}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 bg-navy text-white text-sm font-semibold py-3 px-5 rounded-xl hover:bg-navy-dark transition-colors"
                >
                  <IconCalendarCheck />
                  Réserver une leçon
                </button>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 bg-white text-navy text-sm font-semibold py-3 px-5 rounded-xl border-2 border-navy/15 hover:border-navy/40 transition-colors"
                >
                  <IconMessageCircle />
                  Contacter le moniteur
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center mt-4">
                La réservation et la messagerie seront disponibles prochainement.
              </p>
            </div>

            {/* Verified badge card */}
            <div className="bg-green-dp/5 border border-green-dp/15 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-dp">
                  <IconShieldCheck />
                </span>
                <span className="text-sm font-semibold text-green-dp">
                  Moniteur vérifié Drive-Path
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Ce moniteur a été vérifié par notre équipe : identité, agrément préfectoral et expérience contrôlés.
              </p>
            </div>

          </div>

        </div>
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
            <Link href="#" className="hover:text-gray-600 transition-colors">Conditions d&apos;utilisation</Link>
            <Link href="#" className="hover:text-gray-600 transition-colors">Contact</Link>
          </nav>
        </div>
      </footer>

    </main>
  );
}
