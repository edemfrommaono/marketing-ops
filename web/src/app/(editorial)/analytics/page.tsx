import Link from "next/link";
import { getGlobalKpis } from "@/lib/data/performance";
import { getCampaigns } from "@/lib/data/campaigns";
import { getPlatformBreakdown } from "@/lib/data/calendar";
import { prisma } from "@/lib/db";

// ─── Types & constants ────────────────────────────────────────────────────────

type Period = "7d" | "30d" | "90d" | "12m";

const PERIODS: { key: Period; label: string }[] = [
  { key: "7d",  label: "7J"  },
  { key: "30d", label: "30J" },
  { key: "90d", label: "90J" },
  { key: "12m", label: "12M" },
];

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
const MONTH_NAMES = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPeriodRange(period: Period): { from: Date; to: Date } {
  const to   = new Date();
  const from = new Date();
  if (period === "7d")  from.setDate(from.getDate() - 7);
  if (period === "30d") from.setDate(from.getDate() - 30);
  if (period === "90d") from.setDate(from.getDate() - 90);
  if (period === "12m") from.setFullYear(from.getFullYear() - 1);
  return { from, to };
}

function formatReach(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000)     return `${(value / 1_000).toFixed(0)}k`;
  return String(value);
}

function periodLabel(period: Period): string {
  return { "7d": "7 derniers jours", "30d": "30 derniers jours", "90d": "90 derniers jours", "12m": "12 derniers mois" }[period];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

async function getReachChart(from: Date, to: Date, period: Period) {
  try {
    const records = await prisma.performance.findMany({
      where:  { collectedAt: { gte: from, lte: to } },
      select: { reach: true, collectedAt: true },
    });

    if (period === "7d" || period === "30d") {
      // Daily buckets
      const days = period === "7d" ? 7 : 30;
      const map  = new Map<string, number>();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(to);
        d.setDate(d.getDate() - i);
        map.set(d.toISOString().slice(0, 10), 0);
      }
      for (const r of records) {
        const key = r.collectedAt.toISOString().slice(0, 10);
        if (map.has(key)) map.set(key, (map.get(key) ?? 0) + r.reach);
      }
      return Array.from(map.entries()).map(([key, value]) => ({
        month: key.slice(5), // MM-DD
        value,
      }));
    }

    // Monthly buckets (90d → 3 months, 12m → 12 months)
    const months = period === "90d" ? 3 : 12;
    const map    = new Map<string, number>();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(to.getFullYear(), to.getMonth() - i, 1);
      map.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
    }
    for (const r of records) {
      const key = `${r.collectedAt.getFullYear()}-${String(r.collectedAt.getMonth() + 1).padStart(2, "0")}`;
      if (map.has(key)) map.set(key, (map.get(key) ?? 0) + r.reach);
    }
    return Array.from(map.entries()).map(([key, value]) => ({
      month: MONTH_NAMES[parseInt(key.split("-")[1], 10) - 1],
      value,
    }));
  } catch {
    return [];
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  searchParams: { period?: string };
}

export default async function AnalyticsPage({ searchParams }: Props) {
  const period: Period = (["7d","30d","90d","12m"].includes(searchParams.period ?? ""))
    ? (searchParams.period as Period)
    : "30d";

  const { from, to } = getPeriodRange(period);

  const [kpis, { campaigns }, platformBreakdown, chartData] = await Promise.all([
    getGlobalKpis(from, to),
    getCampaigns({ limit: 20 }),
    getPlatformBreakdown(from, to),
    getReachChart(from, to, period),
  ]);

  const maxReachValue = Math.max(...chartData.map(m => m.value), 1);

  const KPI_TOTALS = [
    {
      label: "Reach total",
      value: formatReach(kpis.totalReach),
      icon:  "visibility",
      sub:   "portée cumulée",
      color: "text-editorial",
    },
    {
      label: "Engagement",
      value: formatReach(kpis.totalEngagement),
      icon:  "favorite",
      sub:   "likes + commentaires + partages",
      color: "text-pink-500",
    },
    {
      label: "CTR moyen",
      value: kpis.avgCtr !== null ? `${kpis.avgCtr.toFixed(1)}%` : "—",
      icon:  "ads_click",
      sub:   "taux de clic",
      color: "text-amber-500",
    },
    {
      label: "Conversions",
      value: String(kpis.totalConversions),
      icon:  "convert_to_text",
      sub:   "leads générés",
      color: "text-emerald-500",
    },
  ];

  return (
    <div className="flex-1 min-h-screen">
      <main className="px-8 py-8 max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-anthracite mb-1">Analytics</h2>
            <p className="text-slate-400 text-sm">{periodLabel(period)}</p>
          </div>
          <div className="flex items-center gap-2">
            {PERIODS.map(p => (
              <Link
                key={p.key}
                href={`/analytics?period=${p.key}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  period === p.key
                    ? "bg-editorial text-white shadow-sm"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p.label}
              </Link>
            ))}
            <a
              href={`/api/analytics/export?from=${from.toISOString()}&to=${to.toISOString()}`}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors ml-2"
              download
            >
              <span className="material-symbols-outlined text-[15px]">download</span>
              Exporter CSV
            </a>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {KPI_TOTALS.map(({ label, value, icon, sub, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-100 shadow-soft p-5">
              <div className="flex items-center justify-between mb-3">
                <span className={`material-symbols-outlined text-[22px] ${color}`}>{icon}</span>
                {kpis.contentCount > 0 && (
                  <span className="text-2xs font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                    {kpis.contentCount} publi.
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-anthracite mb-0.5">{value}</p>
              <p className="text-xs font-semibold text-slate-600 mb-0.5">{label}</p>
              <p className="text-2xs text-slate-400">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Reach chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-soft p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-anthracite">Évolution du reach</h3>
              <span className="text-2xs text-slate-400">{periodLabel(period)}</span>
            </div>
            {chartData.length === 0 || chartData.every(m => m.value === 0) ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <span className="material-symbols-outlined text-slate-300 text-[32px] mb-2">bar_chart</span>
                <p className="text-xs text-slate-400">Aucune donnée de performance sur cette période.</p>
                <p className="text-2xs text-slate-400 mt-1">Publiez du contenu pour voir les statistiques.</p>
              </div>
            ) : (
              <div className="flex items-end gap-1" style={{ height: "160px" }}>
                {chartData.map((m, i) => {
                  const barH   = Math.max(Math.round((m.value / maxReachValue) * BAR_MAX_PX), m.value > 0 ? 4 : 2);
                  const isLast = i === chartData.length - 1;
                  const label  = m.value >= 1000 ? `${(m.value / 1000).toFixed(0)}k` : String(m.value);
                  // Only show some labels if many bars
                  const showLabel = chartData.length <= 12 || i % Math.ceil(chartData.length / 12) === 0 || isLast;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group relative">
                      {m.value > 0 && (
                        <div className="absolute left-1/2 -translate-x-1/2 bg-anthracite text-white text-2xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10"
                          style={{ bottom: `${barH + 28}px` }}>
                          {label}
                        </div>
                      )}
                      <div
                        className={`w-full rounded-t-sm transition-all ${isLast ? "bg-editorial" : "bg-editorial/30 group-hover:bg-editorial/60"}`}
                        style={{ height: `${barH}px` }}
                      />
                      {showLabel && (
                        <span className="text-2xs text-slate-400 truncate w-full text-center">{m.month}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Platform breakdown */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-6">
            <h3 className="text-sm font-bold text-anthracite mb-5">Publications par plateforme</h3>
            {platformBreakdown.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <span className="material-symbols-outlined text-slate-200 text-[28px] mb-2">donut_large</span>
                <p className="text-xs text-slate-400">Aucune donnée pour cette période.</p>
              </div>
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
                            <span className="text-xs font-bold text-anthracite">{p.count}</span>
                            <span className="text-2xs text-slate-400 ml-1">({pct}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="h-2 rounded-full bg-editorial transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Campaign table */}
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
                  <td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-400">
                    Aucune campagne disponible.
                  </td>
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
