import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

// ── Server Action ────────────────────────────────────────────────────────────
async function loginAction(formData: FormData) {
  "use server";

  const email    = formData.get("email")    as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/strategy",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      // Propagate the error code via search param so the client can show it
      redirect(`/auth/login?error=${encodeURIComponent(err.type ?? "CredentialsSignin")}`);
    }
    throw err; // unexpected — re-throw
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────
interface Props {
  searchParams: { error?: string; callbackUrl?: string; reset?: string };
}

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin:      "Email ou mot de passe incorrect.",
  CallbackRouteError:     "Erreur de connexion. Veuillez réessayer.",
  OAuthAccountNotLinked:  "Ce compte est déjà associé à un autre fournisseur.",
  SessionRequired:        "Vous devez être connecté pour accéder à cette page.",
  AccessDenied:           "Accès refusé. Votre compte n'est pas autorisé.",
  Verification:           "Lien de vérification invalide ou expiré.",
  Default:                "Une erreur est survenue. Veuillez réessayer.",
  reset:                  "Mot de passe réinitialisé avec succès. Connectez-vous.",
};

export default function LoginPage({ searchParams }: Props) {
  const errorMessage = searchParams.error
    ? (ERROR_MESSAGES[searchParams.error] ?? ERROR_MESSAGES.Default)
    : null;
  const successMessage = searchParams.reset
    ? ERROR_MESSAGES.reset
    : null;

  return (
    <div className="min-h-screen bg-bg-light flex">
      {/* ── Left — branding panel ──────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-white text-3xl">edit_calendar</span>
          <span className="text-white text-xl font-semibold tracking-tight">
            Odoo <span className="font-light opacity-70">Editorial</span>
          </span>
        </div>

        {/* Quote */}
        <div>
          <blockquote className="text-white/90 text-2xl font-light leading-relaxed mb-6">
            &ldquo;Zero forgotten deliverables.<br />
            Zero missed deadlines.<br />
            Full traceability.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/20" />
            <span className="text-white/40 text-xs uppercase tracking-widest">Maono Ops</span>
            <div className="h-px flex-1 bg-white/20" />
          </div>
        </div>

        {/* KPI stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { n: "1.2M",  l: "Total Reach"    },
            { n: "24",    l: "Campagnes"       },
            { n: "4.8x",  l: "ROI éditorial"  },
          ].map(({ n, l }) => (
            <div key={l} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white text-2xl font-bold">{n}</p>
              <p className="text-white/50 text-xs mt-1">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right — form ───────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <span className="material-symbols-outlined text-editorial text-2xl">edit_calendar</span>
            <span className="text-anthracite text-lg font-semibold">Odoo Editorial</span>
          </div>

          <h1 className="text-2xl font-bold text-anthracite mb-1">Connexion</h1>
          <p className="text-slate-400 text-sm mb-8">Accédez à votre espace éditorial</p>

          {/* Success banner */}
          {successMessage && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 mb-6 text-sm">
              <span className="material-symbols-outlined text-[18px] flex-shrink-0">check_circle</span>
              {successMessage}
            </div>
          )}

          {/* Error banner */}
          {errorMessage && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
              <span className="material-symbols-outlined text-[18px] flex-shrink-0">error</span>
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form action={loginAction} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-anthracite mb-1.5">
                Adresse email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="name@maono-ops.com"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-anthracite">
                  Mot de passe
                </label>
                <a href="/auth/forgot-password" className="text-xs text-editorial hover:underline">
                  Mot de passe oublié ?
                </a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                  lock
                </span>
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none transition-all"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="remember"
                className="rounded border-slate-300 text-editorial focus:ring-editorial/20"
              />
              <span className="text-sm text-slate-600">Se souvenir de moi</span>
            </label>

            <button
              type="submit"
              className="w-full py-2.5 bg-editorial text-white rounded-lg text-sm font-semibold hover:bg-editorial/90 transition-colors shadow-sm"
            >
              Se connecter
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">ou</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            disabled
            title="SSO disponible prochainement"
            className="mt-4 w-full flex items-center justify-center gap-3 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-400 bg-slate-50 cursor-not-allowed opacity-60"
          >
            <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
            Continuer avec SSO
            <span className="ml-auto text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-semibold tracking-wide">BIENTÔT</span>
          </button>

          <p className="mt-8 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Maono Ops — Editorial Platform
          </p>
        </div>
      </div>
    </div>
  );
}
