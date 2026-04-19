import Link from "next/link";
import { notFound } from "next/navigation";
import { getCampaignById } from "@/lib/data/campaigns";
import { getCampaignPerformance, getTopContent } from "@/lib/data/performance";

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

function formatReach(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
}

export default async function CampaignAnalyticsPage({ params }: { params: { id: string } }) {
  const [campaign, actuals, topAll] = await Promise.all([
    getCampaignById(params.id),
    getCampaignPerformance(params.id),
    getTopContent(50),
  ]);

  if (!campaign) notFound();

  // Filter top content to this campaign only
  const campaignContentIds = new Set(
    campaign.calendarEntries.flatMap(e => e.contents.map(c => c.id))
  );
  const topContents = topAll
    .filter(p => campaignContentIds.has(p.contentId))
    .slice(0, 5);

  // KPI targets from campaign
  const kpiTargets = (campaign.kpiTargets as Record<string, number> | null) ?? {};

  const kpiRows = [
    {
      label:  "Reach",
      actual: actuals.reach,
      target: kpiTargets.reach ?? 0,
      fmt:    formatReach,
      unit:   "",
    },
    {
      label:  "Engagement",
      actual: actuals.engagement,
      target: kpiTargets.engagement ?? 0,
      fmt:    (v: number) => String(v),
      unit:   "",
    },
    {
      label:  "Clics",
      actual: actuals.clicks,
      target: kpiTargets.clicks ?? 0,
      fmt:    (v: number) => String(v),
      unit:   "",
    },
    {
      label:  "Conversions",
      actual: actuals.conversions,
      target: kpiTargets.conversions ?? 0,
      fmt:    (v: number) => String(v),
      unit:   " leads",
    },
  ];

  // Platform breakdown from contents → performance → publication.platform
  const platformMap = new Map<string, { reach: number; posts: number }>();
  for (const p of topAll.filter(p => campaignContentIds.has(p.contentId))) {
    const platform = p.publication?.platform ?? "AUTRE";
    const existing = platformMap.get(platform) ?? { reach: 0, posts: 0 };
    platformMap.set(platform, { reach: existing.reach + p.reach, posts: existing.posts + 1 });
  }
  const platformBreakdown = Array.from(platformMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.reach - a.reach);

  const totalPlatformReach = platformBreakdown.reduce((s, p) => s + p.reach, 0);

  const hasPerformance = actuals.count > 0;

  return (
    <div className="flex-1 min-h-screen">
      <main className="px-8 py-8 max-w-[1400px] mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <Link href="/analytics" className="hover:text-anthracite transition-colors">Analytics</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <Link href={`/campaigns/${params.id}`} className="hover:text-anthracite transition-colors">{campaign.name}</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-anthracite font-medium">Performance</span>
        </div>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-anthracite">{campaign.name}</h1>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${STATUS_STYLES[campaign.status] ?? "bg-slate-100 text-slate-600"}`}>
                {STATUS_LABELS[campaign.status] ?? campaign.status}
              </span>
            </div>
            <p className="text-sm text-slate-400">
              {campaign.client?.name ?? "—"}
              {" · "}
              {new Date(campaign.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
              {" → "}
              {new Date(campaign.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href={`/campaigns/${params.id}`} className="flex items-center gap-2 h-9 px-4 bg-editorial text-white rounded-lg text-sm font-semibold hover:bg-editorial/90 shadow-sm">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>Vue campagne
            </Link>
          </div>
        </div>

        {/* KPI progress bars */}
        {!hasPerformance ? (
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-8 mb-8 flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-slate-300 text-[40px] mb-3">bar_chart</span>
            <p className="text-sm font-semibold text-slate-500 mb-1">Aucune donnée de performance</p>
            <p className="text-xs text-slate-400">Les métriques apparaîtront une fois du contenu publié et les performances collectées.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4 mb-8">
            {kpiRows.map(({ label, actual, target, fmt, unit }) => {
              const pct = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
              return (
                <div key={label} className="bg-white rounded-xl border border-slate-100 shadow-soft p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
                  <p className="text-2xl font-bold text-anthracite mb-0.5">{fmt(actual)}{unit}</p>
                  {target > 0 && (
                    <>
                      <p className="text-2xs text-slate-400 mb-3">Objectif: {fmt(target)}{unit}</p>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${pct >= 80 ? "bg-emerald-400" : pct >= 50 ? "bg-editorial" : "bg-amber-400"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-2xs text-slate-400 mt-1">{pct}% de l'objectif</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {hasPerformance && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Platform breakdown */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-6">
              <h3 className="text-sm font-bold text-anthracite mb-5">Par plateforme</h3>
              {platformBreakdown.length === 0 ? (
                <p className="text-xs text-slate-400">Aucune donnée par plateforme.</p>
              ) : (
                <div className="space-y-4">
                  {platformBreakdown.map(p => {
                    const pct = totalPlatformReach > 0 ? Math.round((p.reach / totalPlatformReach) * 100) : 0;
                    return (
                      <div key={p.name}>
                        <div className="flex justify-between items-baseline mb-1.5">
                          <span className="text-xs font-semibold text-anthracite capitalize">{p.name.toLowerCase()}</span>
                          <span className="text-xs font-bold text-anthracite">{formatReach(p.reach)}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="h-2 rounded-full bg-editorial" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-2xs text-slate-400 mt-0.5">{p.posts} post{p.posts !== 1 ? "s" : ""}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Summary stats */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-soft p-6">
              <h3 className="text-sm font-bold text-anthracite mb-5">Résumé de la campagne</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Contenus avec données",       value: actuals.count },
                  { label: "Reach total",                  value: formatReach(actuals.reach) },
                  { label: "Engagement total",             value: actuals.engagement },
                  { label: "Clics totaux",                 value: actuals.clicks },
                  { label: "Conversions",                  value: actuals.conversions },
                  { label: "Entrées calendrier",           value: campaign.calendarEntries.length },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-anthracite">{value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top performing content */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-soft overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-anthracite">Top contenus</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                {["Contenu", "Plateforme", "Reach", "Engagement", "Clics", ""].map(h => (
                  <th key={h} className="px-5 py-3 text-2xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {topContents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-xs text-slate-400">
                    Aucune donnée de performance disponible pour cette campagne.
                  </td>
                </tr>
              )}
              {topContents.map((p, i) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold ${i === 0 ? "text-amber-500" : "text-slate-300"}`}>{i + 1}</span>
                      <span className="text-sm font-medium text-anthracite">{p.content.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">{p.publication?.platform ?? "—"}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-anthracite">{formatReach(p.reach)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-sm font-semibold ${p.engagement >= 5000 ? "text-emerald-600" : p.engagement >= 1000 ? "text-editorial" : "text-amber-600"}`}>
                      {p.engagement}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">{p.clicks}</td>
                  <td className="px-5 py-3.5">
                    <Link href={`/contents/${p.contentId}`} className="text-editorial text-xs font-semibold hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                      Voir →
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
