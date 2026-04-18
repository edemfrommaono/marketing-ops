import Link from "next/link";

const KPI = [
  { label:"Utilisateurs actifs",  value:"12",    icon:"group",          color:"text-blue-600 bg-blue-50"    },
  { label:"Clients",               value:"8",     icon:"business",       color:"text-emerald-600 bg-emerald-50"},
  { label:"Campagnes actives",     value:"3",     icon:"campaign",       color:"text-violet-600 bg-violet-50"},
  { label:"Incidents ouverts",     value:"0",     icon:"warning",        color:"text-slate-400 bg-slate-100" },
];

const SERVICES = [
  { name:"PostgreSQL",  status:"UP",   latency:"4ms",  icon:"database"         },
  { name:"Redis",       status:"UP",   latency:"1ms",  icon:"memory"           },
  { name:"MinIO",       status:"UP",   latency:"12ms", icon:"cloud_upload"     },
  { name:"Odoo API",    status:"UP",   latency:"89ms", icon:"electrical_services"},
  { name:"BullMQ",      status:"UP",   latency:"—",    icon:"queue"            },
];

const RECENT_USERS = [
  { name:"Sophie L.",  email:"sophie@maono.com",  role:"STRATEGIST", createdAt:"Apr 15" },
  { name:"Marc D.",    email:"marc@maono.com",    role:"VIDEOGRAPHER",createdAt:"Apr 12" },
  { name:"Aline T.",   email:"aline@maono.com",   role:"DESIGNER",   createdAt:"Apr 10" },
];

const ROLE_STYLES: Record<string, string> = {
  ADMIN:               "bg-red-50 text-red-700",
  STRATEGIST:          "bg-violet-50 text-violet-700",
  CONTENT_PLANNER:     "bg-blue-50 text-blue-700",
  DESIGNER:            "bg-pink-50 text-pink-700",
  VIDEOGRAPHER:        "bg-amber-50 text-amber-700",
  PHOTOGRAPHER:        "bg-emerald-50 text-emerald-700",
  SOCIAL_MEDIA_MANAGER:"bg-cyan-50 text-cyan-700",
  CLIENT:              "bg-slate-100 text-slate-600",
};

export default function AdminDashboardPage() {
  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-anthracite">Admin Console</h1>
        <p className="text-slate-400 text-sm mt-1">Vue d'ensemble de la plateforme Maono Ops</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {KPI.map(({ label, value, icon, color }) => {
          const [textCls, bgCls] = color.split(" ");
          return (
            <div key={label} className="bg-white rounded-xl border border-slate-100 shadow-soft p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${bgCls}`}>
                <span className={`material-symbols-outlined text-[22px] ${textCls}`}>{icon}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-anthracite">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Services status */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-soft overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-anthracite">Services</h3>
            <Link href="/admin/monitor" className="text-xs text-editorial hover:underline">Monitoring détaillé →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {SERVICES.map(s => (
              <div key={s.name} className="px-6 py-3 flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400 text-[18px]">{s.icon}</span>
                <span className="flex-1 text-sm font-medium text-anthracite">{s.name}</span>
                <span className="text-2xs text-slate-400">{s.latency}</span>
                <span className="flex items-center gap-1.5 text-2xs font-bold text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent users */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-soft overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-anthracite">Utilisateurs récents</h3>
            <Link href="/admin/users" className="text-xs text-editorial hover:underline">Gérer →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {RECENT_USERS.map(u => (
              <div key={u.email} className="px-6 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-editorial/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-editorial">{u.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-anthracite">{u.name}</p>
                  <p className="text-2xs text-slate-400">{u.email}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${ROLE_STYLES[u.role] ?? "bg-slate-100 text-slate-600"}`}>
                  {u.role}
                </span>
                <span className="text-2xs text-slate-400 flex-shrink-0">{u.createdAt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { href:"/admin/users",        icon:"group",                label:"Gérer les utilisateurs", sub:"Inviter, modifier les rôles" },
          { href:"/admin/clients",      icon:"business",             label:"Gérer les clients",      sub:"Créer et archiver les comptes" },
          { href:"/admin/integrations", icon:"electrical_services",  label:"Intégrations",           sub:"Odoo, MinIO, Redis" },
        ].map(({ href, icon, label, sub }) => (
          <Link key={href} href={href} className="bg-white rounded-xl border border-slate-100 shadow-soft p-5 hover:shadow-md hover:border-editorial/30 transition-all group flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-editorial/10 flex items-center justify-center transition-colors flex-shrink-0">
              <span className="material-symbols-outlined text-slate-400 group-hover:text-editorial text-[22px] transition-colors">{icon}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-anthracite">{label}</p>
              <p className="text-2xs text-slate-400">{sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
