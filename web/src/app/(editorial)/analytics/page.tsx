import Link from "next/link";
import { getGlobalKpis } from "@/lib/data/performance";
import { getCampaigns } from "@/lib/data/campaigns";
import { getPlatformBreakdown } from "@/lib/data/calendar";
import { prisma } from "@/lib/db";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:    "bg-emerald-50 text-emerald-700",
  DRAFT:     "bg-slate-100 text-slate-600",
  COMPLETED: "bg-blue-50 text-blue-700",
  PAUSED:    "bg-amber-50 text-amber-700",
  ARCHIVED:  "bg-slate-100 text-slate-400",
};
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Actif", DRAFT: "Brouillon", COMPLETED: "Terminé", PAUSED: "En pause", ARCHIVED: "Archivé",
};

const BAR_MAX_PX = 120;

function formatReach(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000)     return `${(value / 1_000).toFixed(0)}k`;
  return String(value);
}

// Build last-12-months reach data from Performance records
async function getMonthlyReach(): Promise<{ month: string; value: number }[]> {
  try {
    const now  = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const records = await prisma.performance.findMany({
      where:  { collectedAt: { gte: from } },
      select: { reach: true, collectedAt: true },
    });

    // Build map: "YYYY-MM" → sum of reach
    const map = new Map<string, number>();
    for (let i = 0; i < 12; i++) {
      const d = new Date(from.getFullYear(), from.getMonth() + i, 1);
      map.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
    }
    for (const r of records) {
      const key = `${r.collectedAt.getFullYear()}-${String(r.collectedAt.getMonth() + 1).padStart(2, "0")}`;
      if (map.has(key)) map.set(key, (map.get(key) ?? 0) + r.reach);
    }

    const MONTH_NAMES = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
    return Array.from(map.entries()).map(([key, value]) => {
      const monthIdx = parseInt(key.split("-")[1], 10) - 1;
      return { month: MONTH_NAMES[monthIdx], value };
    });
  } catch {
    return Array(12).fill(0).map((_, i) => {
      const MONTH_NAMES = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
      const idx = (new Date().getMonth() - 11 + i + 12) % 12;
      return { month: MONTH_NAMES[idx], value: 0 };
    });
  }
}

export default async function AnalyticsPage() {
  const [kpis, { campaigns }, platformBreakdown, monthlyReach] = await Promise.all([
    getGlobalKpis(),
    getCampaigns({ limit: 20 }),
    getPlatformBreakdown(),
    getMonthlyReach(),
  ]);

  const maxReachValue = Math.max(...monthlyReach.map(m => m.value), 1);

  const KPI_TOTALS = [
    {
      label:    "Reach total",
      value:    formatReach(kpis.totalReach),
      delta:    "—",
      positive: true,
      icon:     "visibility",
      sub:      "portée cumulée",
    },
    {
      label:    "Engagement moyen",
      value:    "—",
      delta:    "—",
      positive: true,
      icon:     "favorite",
      sub:      "objectif: 5%",
    },
    {
      label:    "CTR moyen",
      value:    kpis.avgCtr !== null ? `${kpis.avgCtr.toFixed(1)}%` : "—",
      delta:    "—",
      positive: true,
      icon:     "ads_click",
      sub:      "taux de clic moyen",
    },
    {
      label:    "Conversions",
      value:    String(kpis.totalConversions),
      delta:    "—",
      positive: true,
      icon:     "convert_to_text",
      sub:      "leads générés",
    },
  ];

  return (
    <div className="flex-1 min-h-screen">
      <main className="px-8 py-8 max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-anthracite mb-1">Analytics</h2>
            <p className="text-slate-400 text-sm">Performance globale</p>
          </div>
          <div className="flex gap-3">
            {["7J", "30J", "90J", "12M"].map((p, i) => (
              <button key={p} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                i === 1 ? "bg-editorial text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}>{p}</button>
            ))}
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {KPI_TOTALS.map(({ label, value, delta, positive, icon, sub }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-100 shadow-soft p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="material-symbols-outlined text-[20px] text-slate-400">{icon}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                  {delta}
                </span>
              </div>
              <p className="text-2xl font-bold text-anthracite mb-0.5">{value}</p>
              <p className="text-xs font-semibold text-slate-500 mb-0.5">{label}</p>
              <p className="text-2xs text-slate-400">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Reach chart — monthly trend (real Performance data) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-soft p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-anthracite">Évolution du reach</h3>
              <span className="text-2xs text-slate-400">12 derniers mois</span>
            </div>
            {monthlyReach.every(m => m.value === 0) ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <span className="material-symbols-outlined text-slate-300 text-[32px] mb-2">bar_chart</span>
                <p className="text-xs text-slate-400">Aucune donnée de performance disponible.</p>
                <p className="text-2xs text-slate-400 mt-1">Publiez du contenu pour voir les statistiques.</p>
              </div>
            ) : (
              <div className="flex items-end gap-1.5" style={{ height: "160px" }}>
                {monthlyReach.map((m, i) => {
                  const barH   = Math.round((m.value / maxReachValue) * BAR_MAX_PX);
                  const isLast = i === monthlyReach.length - 1;
                  const label  = m.value >= 1000 ? `${(m.value / 1000).toFixed(0)}k` : String(m.value);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group relative">
                      {m.value > 0 && (
                        <div className="absolute left-1/2 -translate-x-1/2 bg-anthracite text-white text-2xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none" style={{ bottom: `${barH + 24}px` }}>
                          {label}
                        </div>
                      )}
                      <div
                        className={`w-full rounded-t-sm transition-all ${isLast ? "bg-editorial" : "bg-editorial/30 group-hover:bg-editorial/50"}`}
                        style={{ height: `${Math.max(barH, 2)}px` }}
                      />
                      <span className="text-2xs text-slate-400">{m.month}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Platform breakdown — wired to real calendar data */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-6">
            <h3 className="text-sm font-bold text-anthracite mb-5">Publications par plateforme</h3>
            {platformBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400">Aucune donnée disponible pour cette période.</p>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const totalCount = platformBreakdown.reduce((s, p) => s + p.count, 0);
                  return platformBreakdown.map((p, idx) => {
                    const pct = totalCount > 0 ? Math.round((p.count / totalCount) * 100) : 0;
                    return (
                      <div key={p.platform}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-editorial" style={{ opacity: 1 - idx * 0.12 }} />
                            <span className="text-xs font-semibold text-anthracite capitalize">
                              {p.platform.charAt(0) + p.platform.slice(1).toLowerCase()}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-anthracite">{p.count} entrée{p.count !== 1 ? "s" : ""}</span>
                            <span className="text-2xs text-slate-400 ml-1">({pct}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="h-2 rounded-full bg-editorial" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Campaign performance table */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-soft overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-anthracite">Performance par campagne</h3>
            <span className="text-2xs text-slate-400">{campaigns.length} campagne{campaigns.length !== 1 ? "s" : ""}</span>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                {["Campagne", "Statut", "Plateformes", "Entrées calendrier", ""].map(h => (
                  <th key={h} className="px-5 py-3 text-2xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-4 text-xs text-slate-400">Aucune campagne.</td>
                </tr>
              )}
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-anthracite">{c.name}</p>
                    <p className="text-2xs text-slate-400 mt-0.5">{c.client?.name ?? "—"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-2xs font-bold ${STATUS_STYLES[c.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {STATUS_LABELS[c.status] ?? c.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {c.platforms.join(" / ") || "—"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="h-1.5 rounded-full bg-editorial" style={{ width: `${Math.min(100, c._count.calendarEntries * 5)}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-anthracite">{c._count.calendarEntries}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/analytics/campaigns/${c.id}`} className="text-editorial text-xs font-semibold hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                      Détails →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
