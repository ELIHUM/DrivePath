import Image from "next/image";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════
   PAGE — CONDITIONS D'UTILISATION
═══════════════════════════════════════════════════════════ */

export default function TermsPage() {
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
          CONTENT
      ════════════════════════════════════════ */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 lg:px-10 py-12">

        {/* Page title */}
        <div className="mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-navy transition-colors mb-6"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Retour à l&apos;accueil
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-navy mb-2">
            Conditions d&apos;utilisation
          </h1>
          <p className="text-sm text-gray-400">
            Dernière mise à jour : {new Date().getFullYear()}
          </p>
        </div>

        {/* Disclaimer notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-10 flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="flex-shrink-0 mt-0.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm text-amber-800 leading-relaxed">
            Ces informations ont pour objectif de clarifier le rôle de Drive-Path.
            Elles ne constituent pas un avis juridique.
          </p>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-10">

          {/* Section : Rôle de Drive-Path */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl bg-navy/5 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="#0D2B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-navy">Rôle de Drive-Path</h2>
            </div>

            <div className="flex flex-col gap-4 text-sm text-gray-600 leading-relaxed">
              <p>
                Drive-Path est une plateforme destinée à faciliter la mise en relation entre des
                apprenants à la conduite et des moniteurs proposant leurs services.
              </p>
              <p>
                Drive-Path facilite notamment la recherche de profils, la consultation
                d&apos;informations présentées par les moniteurs, la prise de contact et, lorsque
                cette fonctionnalité est disponible, la demande ou la réservation d&apos;une leçon.
              </p>
              <p>
                La prestation de conduite elle-même est réalisée directement entre l&apos;apprenant
                et le moniteur. Les modalités de la prestation, son déroulement, les échanges entre
                les parties et les engagements pris dans le cadre de cette prestation relèvent
                directement de la relation entre l&apos;apprenant et le moniteur.
              </p>
              <p>
                Drive-Path n&apos;est pas partie à la prestation de conduite et ne se substitue pas
                au moniteur dans l&apos;exécution de celle-ci.
              </p>
              <p>
                Les utilisateurs sont invités à vérifier les informations communiquées par leur
                interlocuteur et à prendre connaissance des conditions applicables avant toute
                prestation.
              </p>
            </div>
          </section>

          {/* Section : Objet de la plateforme */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl bg-navy/5 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="#0D2B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-navy">Objet de la plateforme</h2>
            </div>
            <div className="flex flex-col gap-4 text-sm text-gray-600 leading-relaxed">
              <p>
                Drive-Path met à disposition un espace numérique permettant aux apprenants de
                rechercher des moniteurs de conduite, de consulter leurs profils, de prendre
                contact avec eux et, le cas échéant, de soumettre une demande de leçon.
              </p>
              <p>
                Les informations présentées sur les profils des moniteurs sont communiquées par
                ceux-ci sous leur propre responsabilité. Drive-Path s&apos;efforce de vérifier les
                informations essentielles (certification, agrément), mais ne peut garantir
                l&apos;exactitude ou l&apos;exhaustivité de l&apos;ensemble des informations affichées.
              </p>
            </div>
          </section>

          {/* Section : Engagements des utilisateurs */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl bg-navy/5 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="#0D2B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-navy">Engagements des utilisateurs</h2>
            </div>
            <div className="flex flex-col gap-4 text-sm text-gray-600 leading-relaxed">
              <p>
                En utilisant Drive-Path, chaque utilisateur s&apos;engage à fournir des informations
                exactes, à respecter les autres membres de la communauté et à utiliser la
                plateforme conformément à son objet.
              </p>
              <p>
                Toute utilisation abusive, frauduleuse ou contraire aux présentes conditions
                pourra entraîner la suspension ou la suppression du compte concerné.
              </p>
            </div>
          </section>

          {/* Section : Évolution des conditions */}
          <section className="bg-surface rounded-2xl border border-gray-100 p-6 sm:p-8">
            <h2 className="text-base font-bold text-navy mb-3">Évolution de ces conditions</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Ces conditions d&apos;utilisation sont susceptibles d&apos;évoluer à mesure que la
              plateforme se développe. Les utilisateurs seront informés de toute modification
              substantielle. La version en vigueur est celle accessible sur cette page.
            </p>
          </section>

        </div>

        {/* Back link */}
        <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Link
            href="/"
            className="text-sm font-medium text-gray-500 hover:text-navy transition-colors"
          >
            ← Retour à l&apos;accueil
          </Link>
          <span className="hidden sm:block text-gray-200">|</span>
          <Link
            href="/learner"
            className="text-sm font-medium text-gray-500 hover:text-navy transition-colors"
          >
            Trouver un moniteur
          </Link>
        </div>

      </div>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer className="bg-white border-t border-gray-100 px-6 py-8 mt-8">
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
