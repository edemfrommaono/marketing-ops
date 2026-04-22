import Link from "next/link";
import { apiClient } from "@/lib/api-client";

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

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin", STRATEGIST: "Stratégiste", CONTENT_PLANNER: "Planificateur",
  DESIGNER: "Designer", PHOTOGRAPHER: "Photographe", VIDEOGRAPHER: "Vidéaste",
  SOCIAL_MEDIA_MANAGER: "Social Media", CLIENT: "Client",
};

// Infrastructure services — config-based, not DB-driven
const INFRA_SERVICES = [
  { name: "External API", icon: "electrical_services", color: "text-blue-500"  },
  { name: "Next.js",    icon: "electrical_services", color: "text-slate-500"  },
];

export default async function AdminDashboardPage() {
  // Fetch Admin Stats via API
  const response = await apiClient.get<any>("/admin/dashboard-stats");
  const stats = response.data || {
    userCount: 0,
    clientCount: 0,
    activeCampaigns: 0,
    recentUsers: [],
  };

  const { userCount, clientCount, activeCampaigns, recentUsers } = stats;

  const KPI = [
    { label: "Utilisateurs",      value: userCount,        icon: "group",    color: "text-blue-600 bg-blue-50"     },
    { label: "Clients",           value: clientCount,      icon: "business", color: "text-emerald-600 bg-emerald-50"},
    { label: "Campagnes actives", value: activeCampaigns,  icon: "campaign", color: "text-violet-600 bg-violet-50" },
    { label: "Services actifs",   value: INFRA_SERVICES.length, icon: "dns", color: "text-slate-500 bg-slate-100"  },
  ];

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
        {/* Infrastructure services — static config status */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-soft overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-anthracite">Services</h3>
            <Link href="/admin/monitor" className="text-xs text-editorial hover:underline">Monitoring →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {INFRA_SERVICES.map(s => (
              <div key={s.name} className="px-6 py-3 flex items-center gap-3">
                <span className={`material-symbols-outlined text-[18px] ${s.color}`}>{s.icon}</span>
                <span className="flex-1 text-sm font-medium text-anthracite">{s.name}</span>
                <span className="flex items-center gap-1.5 text-2xs font-bold text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Opérationnel
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent users — real DB */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-soft overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-anthracite">Utilisateurs récents</h3>
            <Link href="/admin/users" className="text-xs text-editorial hover:underline">Gérer →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentUsers.length === 0 && (
              <p className="px-6 py-4 text-xs text-slate-400">Aucun utilisateur.</p>
            )}
            {recentUsers.map((u: any) => (
              <div key={u.id} className="px-6 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-editorial/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-editorial">{(u.name ?? u.email ?? "?")[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-anthracite">{u.name ?? "(Sans nom)"}</p>
                  <p className="text-2xs text-slate-400">{u.email ?? "—"}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${ROLE_STYLES[u.role] ?? "bg-slate-100 text-slate-600"}`}>
                  {ROLE_LABELS[u.role] ?? u.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { href: "/admin/users",        icon: "group",               label: "Gérer les utilisateurs", sub: "Inviter, modifier les rôles" },
          { href: "/admin/clients",      icon: "business",            label: "Gérer les clients",      sub: "Créer et archiver les comptes" },
          { href: "/admin/integrations", icon: "electrical_services", label: "Intégrations",           sub: "External Backend API" },
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
