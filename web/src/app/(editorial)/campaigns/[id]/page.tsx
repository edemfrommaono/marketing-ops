import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentStatusBadge } from "@/components/ui/StatusBadge";
import { PlatformBadge } from "@/components/editorial/PlatformBadge";
import { ContentStatus, CampaignStatus } from "@/types/api";
import { getCampaignById } from "@/lib/data/campaigns";

const STATUS_STYLES: Record<CampaignStatus, string> = {
  ACTIVE:    "bg-emerald-50 text-emerald-700",
  DRAFT:     "bg-slate-100 text-slate-600",
  PAUSED:    "bg-amber-50 text-amber-700",
  COMPLETED: "bg-blue-50 text-blue-700",
  ARCHIVED:  "bg-slate-100 text-slate-400",
};
const STATUS_LABELS: Record<CampaignStatus, string> = {
  ACTIVE:    "Actif",
  DRAFT:     "Brouillon",
  PAUSED:    "En pause",
  COMPLETED: "Terminé",
  ARCHIVED:  "Archivé",
};

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const campaign = await getCampaignById(params.id);

  if (campaign === null) {
    notFound();
  }

  // Flatten all contents from all calendar entries
  const contents = campaign.calendarEntries.flatMap(entry =>
    entry.contents.map(c => ({
      id:           c.id,
      title:        c.title,
      platform:     entry.platform,
      status:       c.status,
      deadline:     c.deadline,
      assignedTeam: c.assignedTeam,
    }))
  );

  const openRisks = campaign.risks.filter(r => !r.isResolved).length;

  const inReview    = contents.filter(c => c.status === "INTERNAL_REVIEW" || c.status === "CLIENT_REVIEW").length;
  const published   = contents.filter(c => c.status === "PUBLISHED").length;

  const startDisplay = new Date(campaign.startDate).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
  const endDisplay = new Date(campaign.endDate).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });

  // kpiTargets is Json? — may contain { reach, engagement, ctr, conversions }
  type KpiTargets = { reach?: number; engagement?: number; ctr?: number; conversions?: number };
  const kpiTargets = (campaign.kpiTargets as KpiTargets | null) ?? null;

  const upcomingDeadlines = contents
    .filter(c => c.status !== "PUBLISHED")
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 4);

  return (
    <div className="flex-1 min-h-screen">
      <main className="px-8 py-8 max-w-[1400px] mx-auto">

        {/* Breadcrumb + header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <Link href="/campaigns" className="hover:text-anthracite transition-colors">Campagnes</Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-anthracite font-medium">{campaign.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-anthracite">{campaign.name}</h1>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${STATUS_STYLES[campaign.status]}`}>
                {STATUS_LABELS[campaign.status]}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">{campaign.client.name} · {startDisplay} → {endDisplay}</p>
          </div>
          <div className="flex gap-3">
            <Link href={`/campaigns/${params.id}/edit`} className="flex items-center gap-2 h-9 px-4 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-[16px]">edit</span>Modifier
            </Link>
            <Link href={`/calendar?campaignId=${params.id}`} className="flex items-center gap-2 h-9 px-4 bg-editorial text-white rounded-lg text-sm font-semibold hover:bg-editorial/90 transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[16px]">calendar_month</span>Voir le calendrier
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2/3 */}
          <div className="lg:col-span-2 space-y-6">

            {/* Objective */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Objectif de campagne</h3>
              <p className="text-sm text-anthracite leading-relaxed">{campaign.objective}</p>
              <div className="flex gap-2 mt-4 flex-wrap">
                {campaign.platforms.map(p => <PlatformBadge key={p} platform={p} />)}
              </div>
            </div>

            {/* KPI progress — only shown if kpiTargets is set */}
            {kpiTargets && (
              <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5">Objectifs KPI</h3>
                <div className="grid grid-cols-2 gap-5">
                  {([
                    {
                      label: "Reach",
                      target: kpiTargets.reach ?? 0,
                      fmt: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v),
                      unit: "",
                    },
                    {
                      label: "Engagement",
                      target: kpiTargets.engagement ?? 0,
                      fmt: (v: number) => `${v}`,
                      unit: "%",
                    },
                    {
                      label: "CTR",
                      target: kpiTargets.ctr ?? 0,
                      fmt: (v: number) => `${v}`,
                      unit: "%",
                    },
                    {
                      label: "Conversions",
                      target: kpiTargets.conversions ?? 0,
                      fmt: (v: number) => String(v),
                      unit: " leads",
                    },
                  ] as { label: string; target: number; fmt: (v: number) => string; unit: string }[]).map(({ label, target, fmt, unit }) => (
                    <div key={label}>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-xs font-semibold text-slate-500">{label}</span>
                        <span className="text-xs text-slate-400">Objectif: {fmt(target)}{unit}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="h-2 rounded-full bg-slate-200" style={{ width: "0%" }} />
                      </div>
                      <p className="text-2xs text-slate-400 mt-1">Aucune donnée de performance</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contents table */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-soft overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-sm font-bold text-anthracite">Contenus ({contents.length})</h3>
                <Link href="/contents/new" className="text-xs font-semibold text-editorial hover:underline">+ Ajouter</Link>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    {["Titre", "Plateforme", "Statut", "Deadline", "Équipe"].map(h => (
                      <th key={h} className="px-5 py-3 text-2xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {contents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-4 text-xs text-slate-400">Aucun contenu.</td>
                    </tr>
                  )}
                  {contents.map(ct => (
                    <tr key={ct.id} className="hover:bg-slate-50 group cursor-pointer">
                      <td className="px-5 py-3">
                        <Link href={`/contents/${ct.id}`} className="text-sm font-medium text-anthracite group-hover:text-editorial transition-colors">{ct.title}</Link>
                      </td>
                      <td className="px-5 py-3"><PlatformBadge platform={ct.platform} /></td>
                      <td className="px-5 py-3"><ContentStatusBadge status={ct.status as ContentStatus} /></td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {new Date(ct.deadline).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500 font-medium">{ct.assignedTeam}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Quick stats */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-5 space-y-4">
              {[
                { label: "Contenus totaux",   value: contents.length,                    icon: "article"     },
                { label: "En attente review", value: inReview,                           icon: "rate_review" },
                { label: "Publiés",           value: published,                          icon: "check_circle"},
                { label: "Risques actifs",    value: openRisks, icon: "warning", warn: true },
              ].map(({ label, value, icon, warn }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-[18px] ${warn ? "text-amber-500" : "text-slate-400"}`}>{icon}</span>
                    <span className="text-sm text-slate-600">{label}</span>
                  </div>
                  <span className={`text-sm font-bold ${warn && value > 0 ? "text-amber-600" : "text-anthracite"}`}>{value}</span>
                </div>
              ))}
            </div>

            {/* Upcoming deadlines */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Prochaines deadlines</h4>
              <div className="space-y-3">
                {upcomingDeadlines.length === 0 && (
                  <p className="text-xs text-slate-400">Aucune deadline à venir.</p>
                )}
                {upcomingDeadlines.map(ct => (
                  <div key={ct.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-editorial/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-editorial text-[14px]">event</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-anthracite truncate">{ct.title}</p>
                      <p className="text-2xs text-slate-400">
                        {new Date(ct.deadline).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <ContentStatusBadge status={ct.status as ContentStatus} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
