import { prisma } from "@/lib/db";
import { createCampaign } from "@/lib/actions/campaigns";

export default async function NewCampaignPage() {
  const PLATFORMS = ["INSTAGRAM", "FACEBOOK", "LINKEDIN", "TIKTOK", "YOUTUBE", "X"];
  const PLATFORM_ICONS: Record<string, string> = {
    INSTAGRAM: "photo_camera", FACEBOOK: "thumb_up", LINKEDIN: "business_center",
    TIKTOK: "music_video", YOUTUBE: "play_circle", X: "tag",
  };

  let clients: { id: string; name: string }[] = [];
  try {
    clients = await prisma.client.findMany({
      select:  { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } catch {
    // DB unavailable — fallback to empty list
  }

  return (
    <div className="flex-1 min-h-screen">
      <main className="px-8 py-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
            <a href="/campaigns" className="hover:text-anthracite transition-colors">Campagnes</a>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-anthracite">Nouvelle campagne</span>
          </div>
          <h2 className="text-2xl font-bold text-anthracite">Créer une campagne</h2>
          <p className="text-slate-400 text-sm mt-1">Définissez la direction stratégique et les KPIs cibles</p>
        </div>

        <form action={createCampaign} className="space-y-8">
          {/* Section 1 — Informations */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-6">
            <h3 className="text-sm font-bold text-anthracite uppercase tracking-wider mb-5">Informations générales</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-anthracite mb-1.5">Nom de la campagne *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="ex. Q4 Product Launch 2024"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-anthracite mb-1.5">Client *</label>
                <div className="relative">
                  <select
                    name="clientId"
                    className="w-full appearance-none px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial outline-none bg-white"
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.length > 0 ? (
                      clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="odoo">Odoo SA</option>
                        <option value="eco">EcoPartner</option>
                        <option value="tech">TechCorp</option>
                      </>
                    )}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-anthracite mb-1.5">Objectif de campagne *</label>
                <textarea
                  name="objective"
                  rows={3}
                  placeholder="Décrivez l'objectif stratégique de cette campagne..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-anthracite mb-1.5">Date de début *</label>
                  <input
                    type="date"
                    name="startDate"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-anthracite mb-1.5">Date de fin *</label>
                  <input
                    type="date"
                    name="endDate"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 — Plateformes */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-6">
            <h3 className="text-sm font-bold text-anthracite uppercase tracking-wider mb-5">Plateformes cibles</h3>
            <div className="grid grid-cols-3 gap-3">
              {PLATFORMS.map(p => (
                <label key={p} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:border-editorial/40 hover:bg-editorial/5 transition-all has-[:checked]:border-editorial has-[:checked]:bg-editorial/10">
                  <input type="checkbox" name="platforms" value={p} className="sr-only" />
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">{PLATFORM_ICONS[p]}</span>
                  <span className="text-sm font-medium text-anthracite">{p}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 3 — KPIs */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-6">
            <h3 className="text-sm font-bold text-anthracite uppercase tracking-wider mb-5">KPI Targets</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "reach",      label: "Reach cible",       unit: "personnes", icon: "visibility"        },
                { key: "engagement", label: "Taux d'engagement", unit: "%",         icon: "favorite"          },
                { key: "ctr",        label: "CTR cible",         unit: "%",         icon: "ads_click"         },
                { key: "conversion", label: "Conversions",       unit: "leads",     icon: "convert_to_text"   },
              ].map(({ key, label, unit, icon }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-anthracite mb-1.5">
                    <span className="material-symbols-outlined text-slate-400 text-[16px] align-middle mr-1">{icon}</span>
                    {label}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name={key}
                      placeholder="0"
                      className="w-full pl-4 pr-14 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <a href="/campaigns" className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Annuler
            </a>
            <div className="flex gap-3">
              <button
                type="button"
                className="px-5 py-2.5 border border-editorial text-editorial rounded-lg text-sm font-semibold hover:bg-editorial/5 transition-colors"
              >
                Sauvegarder brouillon
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-editorial text-white rounded-lg text-sm font-semibold hover:bg-editorial/90 transition-colors shadow-sm"
              >
                Créer la campagne
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
