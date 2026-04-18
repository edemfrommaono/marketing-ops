export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center p-8">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-red-500 text-3xl">lock</span>
        </div>
        <h1 className="text-xl font-bold text-anthracite mb-2">Authentification échouée</h1>
        <p className="text-slate-400 text-sm mb-8">
          Identifiants incorrects ou session expirée. Veuillez réessayer.
        </p>
        <a
          href="/auth/login"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-editorial text-white rounded-lg text-sm font-semibold hover:bg-editorial/90 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Retour à la connexion
        </a>
      </div>
    </div>
  );
}
