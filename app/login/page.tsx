import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col bg-surface">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 flex items-center justify-between h-16">
          <Link href="/" className="flex-shrink-0 flex items-center">
            <Image src="/brand/logo-horizontal.png" alt="Drive-Path"
              width={160} height={44} className="h-9 w-auto object-contain" priority />
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-navy mb-2">Connexion</h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              Le système d&apos;authentification sera développé dans une prochaine étape.
            </p>
          </div>

          {/* Placeholder card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-navy">Adresse e-mail</label>
              <input
                type="email" placeholder="votre@email.fr" disabled
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-400 cursor-not-allowed outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-navy">Mot de passe</label>
              <input
                type="password" placeholder="••••••••" disabled
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-400 cursor-not-allowed outline-none"
              />
            </div>
            <button
              type="button" disabled
              className="w-full py-3 rounded-xl text-sm font-semibold bg-gray-100 text-gray-400 cursor-not-allowed mt-1"
            >
              Se connecter
            </button>
          </div>

          {/* Links */}
          <div className="flex flex-col items-center gap-3 mt-6 text-sm text-gray-400">
            <span>Pas encore de compte ?{" "}
              <Link href="/instructor/account" className="text-navy font-medium hover:underline underline-offset-2">
                Créer mon compte moniteur
              </Link>
            </span>
            <Link href="/" className="hover:text-gray-600 transition-colors">
              ← Retour à l&apos;accueil
            </Link>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-3">
            <Image src="/brand/logo-horizontal.png" alt="Drive-Path"
              width={100} height={28} className="h-6 w-auto object-contain opacity-50" />
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
