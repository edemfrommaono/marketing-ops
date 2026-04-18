const INTEGRATIONS = [
  {
    id:       "odoo",
    name:     "Odoo ERP",
    icon:     "electrical_services",
    color:    "text-purple-600 bg-purple-50",
    status:   "CONNECTED",
    endpoint: "https://odoo.maono-ops.com",
    lastSync: "18 Apr 2026, 14h32",
    syncFreq: "Toutes les 15 minutes",
    details:  [
      { label:"Version",          value:"Odoo 17.0" },
      { label:"Base de données",  value:"maono_prod" },
      { label:"Modules actifs",   value:"CRM, Project, Timesheet" },
      { label:"Utilisateurs sync",value:"12" },
    ],
    actions:  ["Synchroniser maintenant","Voir les logs","Reconfigurer"],
  },
  {
    id:       "minio",
    name:     "MinIO (Storage)",
    icon:     "cloud_upload",
    color:    "text-sky-600 bg-sky-50",
    status:   "CONNECTED",
    endpoint: "http://minio:9000",
    lastSync: "En temps réel",
    syncFreq: "Temps réel",
    details:  [
      { label:"Bucket",           value:"maono-assets" },
      { label:"Stockage utilisé", value:"12.4 GB / 100 GB" },
      { label:"Objets",           value:"1 284" },
      { label:"Région",           value:"eu-west-1" },
    ],
    actions:  ["Ouvrir la console","Vider le cache","Reconfigurer"],
  },
  {
    id:       "redis",
    name:     "Redis (Queue)",
    icon:     "memory",
    color:    "text-red-600 bg-red-50",
    status:   "CONNECTED",
    endpoint: "redis://redis:6379",
    lastSync: "Temps réel",
    syncFreq: "Temps réel",
    details:  [
      { label:"Jobs en attente",  value:"3" },
      { label:"Jobs terminés",    value:"1 482" },
      { label:"Jobs échoués",     value:"2" },
      { label:"Uptime",           value:"14 jours" },
    ],
    actions:  ["Vider la file","Relancer les échecs","Monitoring"],
  },
  {
    id:       "smtp",
    name:     "SMTP (Emails)",
    icon:     "mail",
    color:    "text-emerald-600 bg-emerald-50",
    status:   "NOT_CONFIGURED",
    endpoint: "—",
    lastSync: "—",
    syncFreq: "—",
    details:  [
      { label:"Hôte",   value:"—" },
      { label:"Port",   value:"—" },
      { label:"TLS",    value:"—" },
      { label:"Status", value:"Non configuré" },
    ],
    actions:  ["Configurer"],
  },
];

const STATUS_STYLES: Record<string, { badge: string; dot: string; label: string }> = {
  CONNECTED:      { badge:"bg-emerald-50 text-emerald-700 border-emerald-200", dot:"bg-emerald-500", label:"Connecté"       },
  NOT_CONFIGURED: { badge:"bg-slate-100 text-slate-500 border-slate-200",      dot:"bg-slate-300",   label:"Non configuré"  },
  ERROR:          { badge:"bg-red-50 text-red-700 border-red-200",             dot:"bg-red-500",     label:"Erreur"         },
};

export default function AdminIntegrationsPage() {
  const connected = INTEGRATIONS.filter(i => i.status === "CONNECTED").length;

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-anthracite">Intégrations</h1>
        <p className="text-slate-400 text-sm mt-1">{connected}/{INTEGRATIONS.length} services connectés</p>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {INTEGRATIONS.map(integration => {
          const st = STATUS_STYLES[integration.status];
          return (
            <div key={integration.id} className="bg-white rounded-xl border border-slate-100 shadow-soft overflow-hidden">
              {/* Header row */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${integration.color.split(" ")[1]}`}>
                  <span className={`material-symbols-outlined text-[22px] ${integration.color.split(" ")[0]}`}>{integration.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-anthracite">{integration.name}</h3>
                  <p className="text-2xs text-slate-400 font-mono truncate">{integration.endpoint}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-2xs font-bold border flex items-center gap-1.5 ${st.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${st.dot}`} />
                  {st.label}
                </span>
              </div>

              {/* Body */}
              <div className="px-6 py-4 grid grid-cols-2 gap-6">
                {/* Details */}
                <div>
                  <p className="text-2xs font-bold uppercase tracking-wider text-slate-400 mb-3">Informations</p>
                  <div className="space-y-2">
                    {[
                      { label:"Dernière sync", value:integration.lastSync  },
                      { label:"Fréquence",     value:integration.syncFreq  },
                      ...integration.details,
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-2xs text-slate-400">{label}</span>
                        <span className="text-2xs font-semibold text-anthracite">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <p className="text-2xs font-bold uppercase tracking-wider text-slate-400 mb-3">Actions</p>
                  <div className="flex flex-col gap-2">
                    {integration.actions.map(action => (
                      <button key={action} className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-editorial/30 transition-all text-left">
                        <span className="material-symbols-outlined text-[14px] text-slate-400">chevron_right</span>
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
