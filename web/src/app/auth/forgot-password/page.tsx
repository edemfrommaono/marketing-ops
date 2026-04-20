import { forgotPassword } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

async function forgotPasswordAction(formData: FormData) {
  "use server";
  const email = (formData.get("email") as string)?.trim();
  if (!email) redirect("/auth/forgot-password?error=missing");
  await forgotPassword(email);
  redirect("/auth/forgot-password?sent=1");
}

interface Props {
  searchParams: { sent?: string; error?: string };
}

export default function ForgotPasswordPage({ searchParams }: Props) {
  if (searchParams.sent) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center p-8">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-emerald-500 text-[32px]">mark_email_read</span>
          </div>
          <h1 className="text-2xl font-bold text-anthracite mb-2">Email envoyé</h1>
          <p className="text-slate-400 text-sm mb-8">
            Si un compte existe pour cet email, vous recevrez un lien de réinitialisation dans les prochaines minutes.
            Ce lien est valable <strong>1 heure</strong>.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-sm text-editorial hover:underline"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-10">
          <span className="material-symbols-outlined text-editorial text-2xl">edit_calendar</span>
          <span className="text-anthracite text-lg font-semibold">Odoo Editorial</span>
        </div>

        <h1 className="text-2xl font-bold text-anthracite mb-1">Mot de passe oublié</h1>
        <p className="text-slate-400 text-sm mb-8">
          Saisissez votre email pour recevoir un lien de réinitialisation.
        </p>

        {searchParams.error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
            <span className="material-symbols-outlined text-[18px]">error</span>
            Veuillez saisir une adresse email valide.
          </div>
        )}

        <form action={forgotPasswordAction} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-anthracite mb-1.5">
              Adresse email
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">mail</span>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="name@maono-ops.com"
                required
                autoFocus
                autoComplete="email"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-editorial text-white rounded-lg text-sm font-semibold hover:bg-editorial/90 transition-colors shadow-sm"
          >
            Envoyer le lien
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link href="/auth/login" className="text-editorial hover:underline">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
