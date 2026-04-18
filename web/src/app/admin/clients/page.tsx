import Link from "next/link";

const CLIENTS = [
  { id:"c1", name:"Odoo SA",        company:"Odoo",        email:"marketing@odoo.com",      contact:"Laura M.",    campaigns:4, status:"ACTIVE",   revenue:"€24k",  since:"Jan 2024" },
  { id:"c2", name:"EcoPartner",     company:"EcoPartner",  email:"content@ecopartner.io",   contact:"Thomas K.",   campaigns:1, status:"ACTIVE",   revenue:"€8k",   since:"Mar 2024" },
  { id:"c3", name:"TechCorp",       company:"TechCorp SA", email:"media@techcorp.com",      contact:"Ines S.",     campaigns:2, status:"ACTIVE",   revenue:"€15k",  since:"Feb 2024" },
  { id:"c4", name:"Maono Direct",   company:"Maono",       email:"internal@maono.com",      contact:"Admin",       campaigns:1, status:"ACTIVE",   revenue:"—",     since:"Jan 2024" },
  { id:"c5", name:"RetailPOS",      company:"RetailPOS",   email:"contact@retailpos.fr",    contact:"Nina P.",     campaigns:0, status:"INACTIVE", revenue:"€4k",   since:"Nov 2023" },
];

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:   "text-emerald-600",
  INACTIVE: "text-slate-400",
  PAUSED:   "text-amber-600",
};

export default function AdminClientsPage() {
  const active = CLIENTS.filter(c => c.status === "ACTIVE").length;

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-anthracite">Clients</h1>
          <p className="text-slate-400 text-sm mt-1">{CLIENTS.length} comptes · {active} actifs</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-editorial text-white rounded-lg text-sm font-semibold hover:bg-editorial/90 shadow-sm transition-colors">
          <span className="material-symbols-outlined text-[18px]">add_business</span>
          Nouveau client
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-6">
        {["Tous","Actifs","Inactifs"].map((f, i) => (
          <button key={f} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${i === 0 ? "bg-editorial text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{f}</button>
        ))}
        <div className="ml-auto relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span>
          <input placeholder="Rechercher un client..." className="pl-8 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-editorial w-56" />
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {CLIENTS.map(c => (
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
              <span className={`flex items-center gap-1.5 text-2xs font-bold ${STATUS_STYLES[c.status]}`}>
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${c.status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-300"}`} />
                {c.status === "ACTIVE" ? "Actif" : "Inactif"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label:"Campagnes", value:c.campaigns },
                { label:"Revenue",   value:c.revenue    },
                { label:"Depuis",    value:c.since      },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-lg p-2.5 text-center">
                  <p className="text-sm font-bold text-anthracite">{value}</p>
                  <p className="text-2xs text-slate-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xs text-slate-400">Contact</p>
                <p className="text-xs font-medium text-anthracite">{c.contact} · {c.email}</p>
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
