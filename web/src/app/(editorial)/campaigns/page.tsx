import Link from "next/link";
import { getCampaigns } from "@/lib/data/campaigns";
import { CampaignStatus } from "@/types/api";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:    "bg-emerald-50 text-emerald-700",
  DRAFT:     "bg-slate-100 text-slate-600",
  COMPLETED: "bg-blue-50 text-blue-700",
  PAUSED:    "bg-amber-50 text-amber-700",
  ARCHIVED:  "bg-slate-100 text-slate-400",
};
const STATUS_LABELS: Record<string, string> = {
  ACTIVE:"Actif", DRAFT:"Brouillon", COMPLETED:"Terminé", PAUSED:"En pause", ARCHIVED:"Archivé",
};
const PLATFORM_ICONS: Record<string, string> = {
  INSTAGRAM:"photo_camera", FACEBOOK:"thumb_up", LINKEDIN:"business_center",
  TIKTOK:"music_video", YOUTUBE:"play_circle", X:"tag",
};

interface Props {
  searchParams?: { status?: string; page?: string; q?: string };
}

export default async function CampaignsPage({ searchParams }: Props) {
  const page   = Number(searchParams?.page ?? 1);
  const search = searchParams?.q;
  const status = searchParams?.status as CampaignStatus | undefined;

  const { campaigns, total, limit } = await getCampaigns({ status, search, page });

  const activeCount = campaigns.filter(c => c.status === CampaignStatus.ACTIVE).length;
  const start = (page - 1) * limit + 1;
  const end   = Math.min(page * limit, total);
  const hasNext = end < total;
  const hasPrev = page > 1;

  // Fallback mock for empty DB
  const isEmpty = campaigns.length === 0 && !search && !status;

  return (
    <div className="flex-1 min-h-screen">
      <main className="px-8 py-8 max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-anthracite mb-1">Campagnes</h2>
            <p className="text-slate-400 text-sm">
              {total} campagne{total !== 1 ? "s" : ""}{activeCount > 0 ? ` · ${activeCount} active${activeCount !== 1 ? "s" : ""}` : ""}
            </p>
          </div>
          <Link href="/campaigns/new" className="flex items-center gap-2 px-4 py-2 bg-editorial text-white rounded-lg text-sm font-semibold hover:bg-editorial/90 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nouvelle campagne
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          {[
            { label:"Tous",      value:undefined           },
            { label:"Actif",     value:CampaignStatus.ACTIVE    },
            { label:"Brouillon", value:CampaignStatus.DRAFT     },
            { label:"En pause",  value:CampaignStatus.PAUSED    },
            { label:"Terminé",   value:CampaignStatus.COMPLETED },
          ].map(({ label, value }) => (
            <Link
              key={label}
              href={value ? `/campaigns?status=${value}` : "/campaigns"}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                status === value ? "bg-editorial text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {label}
            </Link>
          ))}
          <form className="ml-auto" action="/campaigns" method="GET">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <input name="q" defaultValue={search} placeholder="Rechercher..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-editorial w-52" />
            </div>
          </form>
        </div>

        {/* Empty state */}
        {isEmpty && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4 block">campaign</span>
            <p className="text-sm font-medium text-slate-500 mb-1">Aucune campagne pour l'instant</p>
            <p className="text-xs text-slate-400 mb-4">Créez votre première campagne pour commencer</p>
            <Link href="/campaigns/new" className="inline-flex items-center gap-2 px-4 py-2 bg-editorial text-white rounded-lg text-sm font-semibold">
              <span className="material-symbols-outlined text-[16px]">add</span>Nouvelle campagne
            </Link>
          </div>
        )}

        {/* Table */}
        {!isEmpty && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {["Campagne","Client","Statut","Plateformes","Contenus","Risques",""].map(h => (
                    <th key={h} className="px-5 py-3.5 text-2xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {campaigns.map((c) => {
                  const openRisks = c.risks.filter(r => !r.isResolved).length;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-anthracite group-hover:text-editorial transition-colors">{c.name}</p>
                        <p className="text-2xs text-slate-400 mt-0.5">
                          {new Date(c.startDate).toLocaleDateString("fr-FR", { day:"numeric", month:"short" })}
                          {" → "}
                          {new Date(c.endDate).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" })}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{c.client.name}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-bold ${STATUS_STYLES[c.status]}`}>
                          {STATUS_LABELS[c.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1">
                          {c.platforms.map(p => (
                            <span key={p} className="material-symbols-outlined text-slate-400 text-[16px]" title={p}>
                              {PLATFORM_ICONS[p]}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 font-medium">
                        {c._count.calendarEntries}
                      </td>
                      <td className="px-5 py-4">
                        {openRisks > 0
                          ? <span className="inline-flex items-center gap-1 text-2xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                              <span className="material-symbols-outlined text-[12px]">warning</span>{openRisks}
                            </span>
                          : <span className="text-2xs text-slate-300">—</span>
                        }
                      </td>
                      <td className="px-5 py-4">
                        <Link href={`/campaigns/${c.id}`} className="text-editorial text-xs font-semibold hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                          Voir →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <span className="text-xs text-slate-400">
                {total > 0 ? `Affichage ${start}–${end} sur ${total}` : "Aucun résultat"}
              </span>
              <div className="flex gap-2">
                <Link href={hasPrev ? `/campaigns?page=${page - 1}${status ? `&status=${status}` : ""}` : "#"}
                  className={`px-3 py-1 border border-slate-200 rounded text-xs font-medium bg-white hover:bg-slate-50 ${!hasPrev ? "opacity-40 pointer-events-none" : ""}`}>
                  Précédent
                </Link>
                <Link href={hasNext ? `/campaigns?page=${page + 1}${status ? `&status=${status}` : ""}` : "#"}
                  className={`px-3 py-1 border border-slate-200 rounded text-xs font-medium bg-white hover:bg-slate-50 ${!hasNext ? "opacity-40 pointer-events-none" : ""}`}>
                  Suivant
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
