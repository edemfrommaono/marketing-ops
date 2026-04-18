const USERS = [
  { id:"u1", name:"Admin Maono",   email:"admin@maono-ops.com",   role:"ADMIN",               status:"ACTIVE",   createdAt:"Jan 1, 2024",  lastActive:"Aujourd'hui" },
  { id:"u2", name:"Sophie L.",     email:"sophie@maono.com",      role:"STRATEGIST",           status:"ACTIVE",   createdAt:"Feb 12, 2024", lastActive:"Hier" },
  { id:"u3", name:"Marc D.",       email:"marc@maono.com",        role:"VIDEOGRAPHER",         status:"ACTIVE",   createdAt:"Mar 5, 2024",  lastActive:"Apr 10" },
  { id:"u4", name:"Aline T.",      email:"aline@maono.com",       role:"DESIGNER",             status:"ACTIVE",   createdAt:"Apr 10, 2024", lastActive:"Apr 16" },
  { id:"u5", name:"Jonas K.",      email:"jonas@maono.com",       role:"PHOTOGRAPHER",         status:"ACTIVE",   createdAt:"Apr 1, 2024",  lastActive:"Apr 14" },
  { id:"u6", name:"Chloé V.",      email:"chloe@maono.com",       role:"CONTENT_PLANNER",      status:"ACTIVE",   createdAt:"Mar 20, 2024", lastActive:"Apr 17" },
  { id:"u7", name:"Odoo SA",       email:"portal@odoo.com",       role:"CLIENT",               status:"ACTIVE",   createdAt:"Jan 15, 2024", lastActive:"Apr 15" },
  { id:"u8", name:"Dev Account",   email:"dev@maono-ops.com",     role:"SOCIAL_MEDIA_MANAGER", status:"INACTIVE", createdAt:"Feb 28, 2024", lastActive:"Mar 1" },
];

const ROLES = [
  "ADMIN","STRATEGIST","CONTENT_PLANNER","DESIGNER","PHOTOGRAPHER","VIDEOGRAPHER","SOCIAL_MEDIA_MANAGER","CLIENT"
];

const ROLE_STYLES: Record<string, string> = {
  ADMIN:               "bg-red-50 text-red-700 border-red-200",
  STRATEGIST:          "bg-violet-50 text-violet-700 border-violet-200",
  CONTENT_PLANNER:     "bg-blue-50 text-blue-700 border-blue-200",
  DESIGNER:            "bg-pink-50 text-pink-700 border-pink-200",
  VIDEOGRAPHER:        "bg-amber-50 text-amber-700 border-amber-200",
  PHOTOGRAPHER:        "bg-emerald-50 text-emerald-700 border-emerald-200",
  SOCIAL_MEDIA_MANAGER:"bg-cyan-50 text-cyan-700 border-cyan-200",
  CLIENT:              "bg-slate-100 text-slate-600 border-slate-200",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN:"Admin", STRATEGIST:"Stratégiste", CONTENT_PLANNER:"Planificateur",
  DESIGNER:"Designer", PHOTOGRAPHER:"Photographe", VIDEOGRAPHER:"Vidéaste",
  SOCIAL_MEDIA_MANAGER:"Social Media", CLIENT:"Client",
};

export default function AdminUsersPage() {
  const active   = USERS.filter(u => u.status === "ACTIVE").length;
  const inactive = USERS.filter(u => u.status === "INACTIVE").length;

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-anthracite">Utilisateurs</h1>
          <p className="text-slate-400 text-sm mt-1">{USERS.length} comptes · {active} actifs · {inactive} inactifs</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-editorial text-white rounded-lg text-sm font-semibold hover:bg-editorial/90 shadow-sm transition-colors">
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Inviter un utilisateur
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        {["Tous","Actifs","Inactifs"].map((f, i) => (
          <button key={f} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${i === 0 ? "bg-editorial text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{f}</button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span>
            <input placeholder="Rechercher..." className="pl-8 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-editorial w-48" />
          </div>
          <select className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-editorial bg-white">
            <option value="">Tous les rôles</option>
            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-soft overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              {["Utilisateur","Rôle","Statut","Créé le","Dernière activité",""].map(h => (
                <th key={h} className="px-5 py-3 text-2xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {USERS.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-editorial/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-editorial">{u.name[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-anthracite">{u.name}</p>
                      <p className="text-2xs text-slate-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-2xs font-bold border ${ROLE_STYLES[u.role]}`}>
                    {ROLE_LABELS[u.role]}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${u.status === "ACTIVE" ? "text-emerald-600" : "text-slate-400"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full inline-block ${u.status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-300"}`} />
                    {u.status === "ACTIVE" ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-500">{u.createdAt}</td>
                <td className="px-5 py-3.5 text-xs text-slate-500">{u.lastActive}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-anthracite transition-colors">
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                      <span className="material-symbols-outlined text-[16px]">block</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite modal placeholder */}
      <div className="mt-6 bg-pastel-blue rounded-xl border border-editorial/20 p-5 flex items-start gap-4">
        <span className="material-symbols-outlined text-editorial text-[22px] flex-shrink-0 mt-0.5">info</span>
        <div>
          <p className="text-sm font-semibold text-editorial">Invitation par email</p>
          <p className="text-xs text-slate-600 mt-0.5">
            Les utilisateurs invités reçoivent un lien de connexion valable 48h.
            Un mot de passe peut être défini lors de la première connexion.
          </p>
        </div>
      </div>
    </div>
  );
}
