import { createClient } from "@/lib/actions/clients";
import { redirect } from "next/navigation";
import Link from "next/link";

async function createClientAction(formData: FormData) {
  "use server";
  const result = await createClient(formData);
  if (result.success) {
    redirect("/admin/clients");
  }
  // On error, redirect back with error param
  redirect(`/admin/clients/new?error=${encodeURIComponent(result.error ?? "Erreur inconnue")}`);
}

interface Props {
  searchParams: { error?: string };
}

export default function NewClientPage({ searchParams }: Props) {
  return (
    <div className="max-w-[640px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/clients"
          className="p-2 rounded-lg hover:bg-block-light text-sand hover:text-secondary transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-anthracite">Nouveau client</h1>
          <p className="text-slate-400 text-sm mt-1">Créez un compte client pour démarrer une collaboration</p>
        </div>
      </div>

      {/* Error banner */}
      {searchParams.error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
          <span className="material-symbols-outlined text-[18px] flex-shrink-0">error</span>
          {searchParams.error}
        </div>
      )}

      <form action={createClientAction} className="space-y-6">
        {/* Identity */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-5">Identité</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-anthracite mb-1.5">
                Nom du contact *
              </label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="ex. Sophie Martin"
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-anthracite mb-1.5">
                Nom de la société *
              </label>
              <input
                id="company"
                type="text"
                name="company"
                placeholder="ex. Odoo SA"
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-anthracite mb-1.5">
                Email de contact *
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">mail</span>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="contact@societe.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none transition-all"
                />
              </div>
              <p className="text-2xs text-slate-400 mt-1">
                Cet email sera utilisé pour envoyer le lien du portail client.
              </p>
            </div>

            <div>
              <label htmlFor="contactName" className="block text-sm font-medium text-anthracite mb-1.5">
                Nom du responsable (optionnel)
              </label>
              <input
                id="contactName"
                type="text"
                name="contactName"
                placeholder="ex. Marc Dupont — Directeur marketing"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-blue-500 text-[20px] flex-shrink-0 mt-0.5">info</span>
          <div>
            <p className="text-sm font-semibold text-blue-800">Portail client</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Après création, vous pourrez générer un lien de portail sécurisé depuis la fiche client.
              Le client pourra consulter et approuver ses contenus sans avoir de compte.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/admin/clients"
            className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-editorial text-white rounded-lg text-sm font-semibold hover:bg-editorial/90 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add_business</span>
            Créer le client
          </button>
        </div>
      </form>
    </div>
  );
}
