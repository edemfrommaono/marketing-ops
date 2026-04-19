import Link from "next/link";
import { getClients } from "@/lib/data/clients";

export default async function AdminClientsPage() {
  const clients = await getClients();
  const active  = clients.filter(c => c.isActive).length;

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-anthracite">Clients</h1>
          <p className="text-slate-400 text-sm mt-1">{clients.length} compte{clients.length !== 1 ? "s" : ""} · {active} actif{active !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/admin/clients/new"
          className="flex items-center gap-2 px-4 py-2 bg-editorial text-white rounded-lg text-sm font-semibold hover:bg-editorial/90 shadow-sm transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add_business</span>
          Nouveau client
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        {["Tous", "Actifs", "Inactifs"].map((f, i) => (
          <button key={f} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${i === 0 ? "bg-editorial text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{f}</button>
        ))}
        <div className="ml-auto relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span>
          <input placeholder="Rechercher un client..." className="pl-8 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-editorial w-56" />
        </div>
      </div>

      {/* Empty state */}
      {clients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-slate-400 text-[32px]">business</span>
          </div>
          <h3 className="text-base font-bold text-anthracite mb-1">Aucun client</h3>
          <p className="text-slate-400 text-sm mb-6">Créez votre premier compte client pour commencer.</p>
          <Link href="/admin/clients/new" className="flex items-center gap-2 px-4 py-2 bg-editorial text-white rounded-lg text-sm font-semibold hover:bg-editorial/90 shadow-sm transition-colors">
            <span className="material-symbols-outlined text-[18px]">add_business</span>
            Nouveau client
          </Link>
        </div>
      )}

      {/* Cards grid */}
      {clients.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {clients.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-100 shadow-soft p-5 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-slate-600">{c.name[0]}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-anthracite">{c.name}</h3>
                    <p className="text-2xs text-slate-400">{c.company}</p>
                  </div>
                </div>
                <span className={`flex items-center gap-1.5 text-2xs font-bold ${c.isActive ? "text-emerald-600" : "text-slate-400"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${c.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                  {c.isActive ? "Actif" : "Inactif"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Campagnes", value: c.campaigns },
                  { label: "Contact",   value: c.contactName ?? "—" },
                  { label: "Depuis",    value: c.createdAt },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-lg p-2.5 text-center">
                    <p className="text-sm font-bold text-anthracite truncate">{value}</p>
                    <p className="text-2xs text-slate-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xs text-slate-400">Email</p>
                  <p className="text-xs font-medium text-anthracite">{c.email}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-anthracite transition-colors">
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <Link href={`/campaigns?client=${c.id}`} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-editorial transition-colors">
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Client portal info */}
      <div className="bg-pastel-cream rounded-xl border border-primary/10 p-5 flex items-start gap-4">
        <span className="material-symbols-outlined text-primary text-[22px] flex-shrink-0 mt-0.5">link</span>
        <div>
          <p className="text-sm font-semibold text-anthracite">Portail client sécurisé</p>
          <p className="text-xs text-slate-600 mt-0.5">
            Chaque client dispose d'un accès tokenisé à son portail de validation.
            Le lien est généré automatiquement à la création du compte.
            Format : <code className="bg-white px-1 py-0.5 rounded text-2xs">/client/[token]</code>
          </p>
        </div>
      </div>
    </div>
  );
}
