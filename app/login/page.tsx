import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center bg-white">
      <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>
      <p className="text-gray-400 max-w-sm">
        Le système d&apos;authentification sera développé dans une prochaine étape.
      </p>
      <Link
        href="/"
        className="mt-4 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors underline underline-offset-4"
      >
        ← Retour à l&apos;accueil
      </Link>
    </main>
  );
}
