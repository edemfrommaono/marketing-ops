export default function AdminSettingsPage() {
  return (
    <div className="max-w-[800px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-anthracite">Paramètres</h1>
        <p className="text-slate-400 text-sm mt-1">Configuration générale de la plateforme</p>
      </div>

      <div className="space-y-6">
        {/* Platform identity */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-6">
          <h3 className="text-sm font-bold text-anthracite mb-5">Identité de la plateforme</h3>
          <div className="space-y-4">
            {[
              { id:"platform-name", label:"Nom de la plateforme", value:"Maono Ops — Editorial", type:"text"  },
              { id:"platform-url",  label:"URL de la plateforme", value:"https://ops.maono.com",  type:"url"   },
              { id:"support-email", label:"Email de support",     value:"ops@maono.com",           type:"email" },
            ].map(({ id, label, value, type }) => (
              <div key={id}>
                <label htmlFor={id} className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
                <input id={id} type={type} defaultValue={value}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-6">
          <h3 className="text-sm font-bold text-anthracite mb-5">Notifications</h3>
          <div className="space-y-4">
            {[
              { id:"notif-deadlines",  label:"Rappels de deadline",              sub:"Notifier les équipes J-7, J-3, J-1, J-0",  checked:true  },
              { id:"notif-approvals",  label:"Nouvelles approbations",           sub:"Alerter dès qu'un contenu entre en révision", checked:true },
              { id:"notif-publish",    label:"Confirmation de publication",      sub:"Email de confirmation après chaque publication",checked:false},
              { id:"notif-incidents",  label:"Alertes incidents système",        sub:"Notifier l'admin en cas d'erreur critique",   checked:true  },
            ].map(({ id, label, sub, checked }) => (
              <div key={id} className="flex items-start justify-between gap-4 py-2 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-anthracite">{label}</p>
                  <p className="text-2xs text-slate-400 mt-0.5">{sub}</p>
                </div>
                <label className="flex-shrink-0 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" defaultChecked={checked} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 rounded-full peer-checked:bg-editorial transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Content lifecycle */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-6">
          <h3 className="text-sm font-bold text-anthracite mb-5">Workflow éditorial</h3>
          <div className="space-y-4">
            {[
              { id:"require-internal",  label:"Révision interne obligatoire",     checked:true  },
              { id:"require-client",    label:"Révision client obligatoire",       checked:false },
              { id:"auto-archive",      label:"Archivage auto après 90 jours",    checked:true  },
              { id:"dual-approval",     label:"Double approbation sur les reels", checked:false },
            ].map(({ id, label, checked }) => (
              <div key={id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-anthracite">{label}</span>
                <label className="cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" defaultChecked={checked} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 rounded-full peer-checked:bg-editorial transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-6">
          <h3 className="text-sm font-bold text-anthracite mb-5">Sécurité</h3>
          <div className="space-y-3">
            {[
              { label:"Durée de session (JWT)", value:"30 jours", type:"select", options:["1 jour","7 jours","30 jours","90 jours"] },
              { label:"Délai d'expiration des liens client (portail)", value:"7 jours", type:"select", options:["24h","48h","7 jours","30 jours"] },
            ].map(({ label, value, options }) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <label className="text-sm text-anthracite">{label}</label>
                <div className="relative">
                  <select defaultValue={value} className="appearance-none px-4 py-2 pr-8 border border-slate-200 rounded-lg text-sm outline-none focus:border-editorial bg-white">
                    {options.map(o => <option key={o}>{o}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[16px]">expand_more</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-red-50 rounded-xl border border-red-200 p-6">
          <h3 className="text-sm font-bold text-red-700 mb-4">Zone de danger</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-anthracite">Purger le cache Redis</p>
                <p className="text-2xs text-slate-500">Efface tous les jobs en attente. Irréversible.</p>
              </div>
              <button className="px-3 py-1.5 border border-red-300 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">
                Purger
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-anthracite">Réinitialiser les intégrations</p>
                <p className="text-2xs text-slate-500">Déconnecte Odoo, MinIO et Redis. Requiert une reconfiguration.</p>
              </div>
              <button className="px-3 py-1.5 border border-red-300 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end gap-3 pt-2">
          <button className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
            Annuler
          </button>
          <button className="px-5 py-2.5 bg-editorial text-white rounded-lg text-sm font-semibold hover:bg-editorial/90 shadow-sm">
            Sauvegarder les modifications
          </button>
        </div>
      </div>
    </div>
  );
}
