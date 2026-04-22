import { apiClient } from "@/lib/api-client";

// Static infrastructure services (config-based, not user-managed)
const INFRA_SERVICES = [
  {
    id:      "api",
    name:    "External API",
    icon:    "electrical_services",
    color:   "text-blue-600 bg-blue-50",
    endpoint: process.env.NEXT_PUBLIC_API_URL || "Non configuré",
    details: [
      { label: "Type",   value: "REST / JSON" },
      { label: "Statut", value: "Connecté" },
    ],
  },
];

export default async function AdminIntegrationsPage() {
  // Fetch user integration connections via API
  const response = await apiClient.get<any[]>("/admin/integrations");
  const connections = response.data || [];

  const byProvider = connections.reduce<Record<string, any[]>>((acc, c) => {
    (acc[c.provider] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-anthracite">Intégrations</h1>
        <p className="text-slate-400 text-sm mt-1">Services connectés et infrastructure</p>
      </div>

      {/* User integration connections */}
      <div className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Connexions utilisateurs</h2>
        {connections.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-8 text-center">
            <span className="material-symbols-outlined text-slate-300 text-[40px] mb-3 block">electrical_services</span>
            <p className="text-sm font-medium text-slate-500 mb-1">Aucune intégration configurée</p>
            <p className="text-xs text-slate-400">Les connexions Odoo, Google ou autres services apparaîtront ici.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(byProvider).map(([provider, conns]) => (
              <div key={provider} className="bg-white rounded-xl border border-slate-100 shadow-soft overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-violet-600 text-[22px]">electrical_services</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-anthracite capitalize">{provider}</h3>
                    <p className="text-2xs text-slate-400">{conns.length} connexion{conns.length !== 1 ? "s" : ""}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Connecté
                  </span>
                </div>
                <div className="divide-y divide-slate-50">
                  {conns.map(c => (
                    <div key={c.id} className="px-6 py-3 flex items-center gap-3 text-sm">
                      <div className="w-7 h-7 rounded-full bg-editorial/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-editorial">{(c.user?.name ?? c.user?.email ?? "?")[0].toUpperCase()}</span>
                      </div>
                      <span className="flex-1 text-xs font-medium text-anthracite">{c.user?.name ?? c.user?.email}</span>
                      {c.providerUrl && (
                        <span className="text-2xs text-slate-400 font-mono truncate max-w-[200px]">{c.providerUrl}</span>
                      )}
                      <span className="text-2xs text-slate-400">
                        {new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Infrastructure services */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Infrastructure</h2>
        <div className="space-y-4">
          {INFRA_SERVICES.map(svc => (
            <div key={svc.id} className="bg-white rounded-xl border border-slate-100 shadow-soft overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${svc.color.split(" ")[1]}`}>
                  <span className={`material-symbols-outlined text-[22px] ${svc.color.split(" ")[0]}`}>{svc.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-anthracite">{svc.name}</h3>
                  <p className="text-2xs text-slate-400 font-mono truncate">{svc.endpoint}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold border bg-slate-100 text-slate-600 border-slate-200">
                  Config
                </span>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-2">
                  {svc.details.map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-2xs text-slate-400">{label}</span>
                      <span className="text-2xs font-semibold text-anthracite">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
