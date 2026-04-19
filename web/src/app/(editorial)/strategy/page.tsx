import Link from "next/link";
import { KpiCard } from "@/components/ui/KpiCard";
import { KanbanCard } from "@/components/editorial/KanbanCard";
import { KanbanColumn } from "@/components/editorial/KanbanColumn";
import { getStrategyKpis, getKanbanColumns, getUpcomingEntries } from "@/lib/data/strategy";

const PLATFORM_ICONS: Record<string, string> = {
  INSTAGRAM: "photo_camera",
  FACEBOOK:  "thumb_up",
  LINKEDIN:  "business_center",
  TIKTOK:    "music_video",
  YOUTUBE:   "play_circle",
  X:         "tag",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT:             "Brouillon",
  IN_PRODUCTION:     "En production",
  INTERNAL_REVIEW:   "Révision interne",
  CLIENT_REVIEW:     "Révision client",
  APPROVED:          "Approuvé",
  REVISION_REQUIRED: "Révision requise",
  SCHEDULED:         "Planifié",
  PUBLISHED:         "Publié",
  ARCHIVED:          "Archivé",
};

export default async function StrategyPage() {
  const [kpis, columns, upcoming] = await Promise.all([
    getStrategyKpis(),
    getKanbanColumns(),
    getUpcomingEntries(3),
  ]);

  const isEmpty = kpis.totalClients === 0 && kpis.activeCampaigns === 0;

  // ── Empty / first-run state ──────────────────��────────────────────────────
  if (isEmpty) {
    return (
      <div className="flex-1 min-h-screen">
        <main className="px-8 py-8 max-w-[1280px] mx-auto">
          <div className="mb-10">
            <h2 className="text-anthracite text-2xl font-bold mb-1">Strategic Overview</h2>
            <p className="text-slate-400 text-sm">Editorial performance and upcoming content pipelines</p>
          </div>

          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-editorial/10 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-editorial text-[40px]">rocket_launch</span>
            </div>
            <h3 className="text-xl font-bold text-anthracite mb-2">Bienvenue sur Maono Ops</h3>
            <p className="text-slate-400 text-sm max-w-md mb-8">
              Aucun client ni campagne n'a encore été créé. Lancez l'assistant de configuration pour démarrer.
            </p>
            <Link
              href="/onboarding"
              className="flex items-center gap-2 px-6 py-3 bg-editorial text-white rounded-xl text-sm font-semibold hover:bg-editorial/90 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              Commencer la configuration
            </Link>
            <div className="mt-8 flex gap-4">
              <Link href="/admin/clients" className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                <span className="material-symbols-outlined text-[16px]">add_business</span>
                Créer un client
              </Link>
              <Link href="/campaigns/new" className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                <span className="material-symbols-outlined text-[16px]">add</span>
                Créer une campagne
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Full dashboard ──────────────────────────────────���─────────────────────
  return (
    <div className="flex-1 min-h-screen xl:pr-72">
      <main className="px-8 py-8 max-w-[1280px] mx-auto">

        {/* ── Page header ── */}
        <div className="mb-10">
          <h2 className="text-anthracite text-2xl font-bold mb-1">Strategic Overview</h2>
          <p className="text-slate-400 text-sm">Editorial performance and upcoming content pipelines</p>
        </div>

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          <KpiCard
            label="Clients actifs"
            value={kpis.totalClients}
            subtext="comptes clients"
            icon="business"
            featured
          />
          <KpiCard
            label="Campagnes actives"
            value={kpis.activeCampaigns}
            subtext="en cours ou brouillon"
            icon="campaign"
          />
          <KpiCard
            label="Contenus totaux"
            value={kpis.totalContents}
            subtext="dans la production"
            icon="description"
          />
          <KpiCard
            label="Publiés"
            value={kpis.publishedContents}
            subtext="contenus en ligne"
            icon="check_circle"
            progress={kpis.totalContents > 0 ? Math.round((kpis.publishedContents / kpis.totalContents) * 100) : 0}
          />
        </div>

        {/* ── Kanban board ── */}
        <div className="flex gap-5 overflow-x-auto pb-4">

          {/* Column 1 — Brouillon */}
          <KanbanColumn
            title="Brouillon"
            count={columns.backlog.length}
            dotColor="bg-slate-400"
            countColor="text-slate-500"
            bg="bg-pastel-grey"
            showAddButton
          >
            {columns.backlog.length === 0 ? (
              <p className="text-2xs text-slate-400 italic px-1">Aucun contenu.</p>
            ) : (
              columns.backlog.map(c => (
                <KanbanCard key={c.id} title={c.title} type={c.format} />
              ))
            )}
          </KanbanColumn>

          {/* Column 2 — Production */}
          <KanbanColumn
            title="En production"
            count={columns.production.length}
            dotColor="bg-editorial"
            countColor="text-editorial"
            bg="bg-pastel-blue"
          >
            {columns.production.length === 0 ? (
              <p className="text-2xs text-slate-400 italic px-1">Aucun contenu.</p>
            ) : (
              columns.production.map(c => (
                <KanbanCard
                  key={c.id}
                  title={c.title}
                  type={c.format}
                  statusLabel={STATUS_LABEL[c.status] ?? c.status}
                  statusIcon="autorenew"
                  statusColor="text-editorial"
                  borderHover="hover:border-editorial"
                />
              ))
            )}
          </KanbanColumn>

          {/* Column 3 — Validation */}
          <KanbanColumn
            title="Validation"
            count={columns.distribution.length}
            dotColor="bg-amber-400"
            countColor="text-amber-600"
            bg="bg-pastel-cream"
          >
            {columns.distribution.length === 0 ? (
              <p className="text-2xs text-slate-400 italic px-1">Aucun contenu.</p>
            ) : (
              columns.distribution.map(c => (
                <KanbanCard
                  key={c.id}
                  title={c.title}
                  type={c.format}
                  statusLabel={STATUS_LABEL[c.status] ?? c.status}
                  statusIcon="rocket_launch"
                  statusColor="text-amber-600"
                  borderHover="hover:border-amber-400/30"
                />
              ))
            )}
          </KanbanColumn>

          {/* Column 4 — Publiés */}
          <KanbanColumn
            title="Publié / Archivé"
            count={columns.live.length}
            dotColor="bg-green-500"
            countColor="text-slate-400"
            bg="bg-slate-50"
            borderStyle="border border-dashed border-slate-200"
            dimContent
          >
            {columns.live.length === 0 ? (
              <p className="text-2xs text-slate-400 italic px-1">Aucun contenu publié.</p>
            ) : (
              columns.live.map(c => (
                <div key={c.id} className="bg-white p-4 rounded-lg shadow-soft border border-slate-100">
                  <h4 className="text-anthracite font-medium text-sm leading-snug mb-1">{c.title}</h4>
                  <p className="text-2xs text-slate-400">{STATUS_LABEL[c.status] ?? c.status}</p>
                </div>
              ))
            )}
          </KanbanColumn>
        </div>
      </main>

      {/* ── Fixed right panel — Upcoming publications ── */}
      <aside className="hidden xl:block fixed right-0 top-16 bottom-0 w-72 bg-white border-l border-slate-100 p-6 overflow-y-auto">
        <h5 className="text-anthracite font-bold text-sm mb-5">Prochaines publications</h5>
        {upcoming.length === 0 ? (
          <p className="text-2xs text-slate-400">Aucune publication planifiée.</p>
        ) : (
          <div className="space-y-5">
            {upcoming.map(entry => {
              const d = new Date(entry.publicationDate);
              return (
                <div key={entry.id} className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-editorial/10 flex flex-col items-center justify-center">
                    <span className="text-editorial text-xs font-bold leading-none">
                      {d.toLocaleDateString("fr-FR", { day: "2-digit" })}
                    </span>
                    <span className="text-editorial text-2xs leading-none uppercase">
                      {d.toLocaleDateString("fr-FR", { month: "short" })}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-anthracite leading-snug">{entry.theme}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="material-symbols-outlined text-slate-400 text-[14px]">
                        {PLATFORM_ICONS[entry.platform] ?? "public"}
                      </span>
                      <p className="text-2xs text-slate-400 truncate">{entry.campaignName}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Content health — based on real counts */}
        <div className="mt-10 pt-7 border-t border-slate-100">
          <h5 className="text-anthracite font-bold text-sm mb-4">Répartition du contenu</h5>
          {kpis.totalContents === 0 ? (
            <p className="text-2xs text-slate-400">Aucun contenu encore créé.</p>
          ) : (
            <div className="space-y-4">
              {[
                {
                  label: "Publiés",
                  value: kpis.totalContents > 0
                    ? Math.round((kpis.publishedContents / kpis.totalContents) * 100)
                    : 0,
                  color: "bg-green-500",
                },
                {
                  label: "En production",
                  value: kpis.totalContents > 0
                    ? Math.round((columns.production.length / kpis.totalContents) * 100)
                    : 0,
                  color: "bg-editorial",
                },
                {
                  label: "Brouillons",
                  value: kpis.totalContents > 0
                    ? Math.round((columns.backlog.length / kpis.totalContents) * 100)
                    : 0,
                  color: "bg-slate-300",
                },
              ].map(m => (
                <div key={m.label} className="space-y-1">
                  <div className="flex justify-between text-2xs font-medium text-slate-500">
                    <span>{m.label}</span>
                    <span>{m.value}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div className={`${m.color} h-full rounded-full`} style={{ width: `${m.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
