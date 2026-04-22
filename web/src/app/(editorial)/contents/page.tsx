import Link from "next/link";
import { ContentStatusBadge, TeamBadge } from "@/components/ui/StatusBadge";
import { PlatformBadge } from "@/components/editorial/PlatformBadge";
import { ContentStatus, ProductionTeam } from "@/types/api";
import { getContents } from "@/lib/data/contents";

const TEAM_LABELS: Record<ProductionTeam, string> = {
  DESIGN:"Design", VIDEO:"Vidéo", PHOTOGRAPHY:"Photo", COPYWRITING:"Copy",
};

interface Props {
  searchParams?: { team?: ProductionTeam; q?: string; page?: string };
}

export default async function ContentsPage({ searchParams }: Props) {
  const team   = searchParams?.team;
  const search = searchParams?.q;
  const page   = Number(searchParams?.page ?? 1);

  const { contents, total } = await getContents({ team, search, page });

  // A content is "urgent" if deadline is within 2 days
  const now = new Date();
  const urgentCount = contents.filter(c => {
    const diff = (new Date(c.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 2 && c.status !== ContentStatus.PUBLISHED;
  }).length;

  const isEmpty = contents.length === 0 && !search && !team;

  return (
    <div className="flex-1 min-h-screen">
      <main className="px-8 py-8 max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-anthracite mb-1">File de production</h2>
            <p className="text-slate-400 text-sm">
              {total} contenu{total !== 1 ? "s" : ""}
              {urgentCount > 0 && <> · <span className="text-amber-600 font-medium">{urgentCount} urgent{urgentCount !== 1 ? "s" : ""}</span></>}
            </p>
          </div>
          <Link href="/contents/new" className="flex items-center gap-2 px-4 py-2 bg-editorial text-white rounded-lg text-sm font-semibold hover:bg-editorial/90 shadow-sm transition-colors">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nouveau contenu
          </Link>
        </div>

        {/* Team filter tabs */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide mr-1">ÉQUIPE</span>
          {[
            { label:"Tous", value:undefined },
            { label:"Design",       value:ProductionTeam.DESIGN      },
            { label:"Vidéo",        value:ProductionTeam.VIDEO        },
            { label:"Photo",        value:ProductionTeam.PHOTOGRAPHY  },
            { label:"Copywriting",  value:ProductionTeam.COPYWRITING  },
          ].map(({ label, value }) => (
            <Link
              key={label}
              href={value ? `/contents?team=${value}` : "/contents"}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                team === value ? "bg-editorial text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {label}
            </Link>
          ))}
          <form className="ml-auto" action="/contents" method="GET">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span>
              <input name="q" defaultValue={search} placeholder="Rechercher un titre..." className="pl-8 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-editorial w-48" />
            </div>
          </form>
        </div>

        {/* Empty state */}
        {isEmpty && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4 block">edit_note</span>
            <p className="text-sm font-medium text-slate-500 mb-1">Aucun contenu en production</p>
            <p className="text-xs text-slate-400 mb-4">Créez votre premier contenu depuis une campagne</p>
            <Link href="/contents/new" className="inline-flex items-center gap-2 px-4 py-2 bg-editorial text-white rounded-lg text-sm font-semibold">
              <span className="material-symbols-outlined text-[16px]">add</span>Nouveau contenu
            </Link>
          </div>
        )}

        {/* List */}
        {!isEmpty && (
          <div className="space-y-2">
            {contents.map((ct) => {
              const deadline = new Date(ct.deadline);
              const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const isUrgent = daysLeft <= 2 && ct.status !== ContentStatus.PUBLISHED;

              return (
                <Link key={ct.id} href={`/contents/${ct.id}`} className={`block bg-white rounded-xl border shadow-soft p-4 hover:shadow-md transition-all ${
                  isUrgent ? "border-amber-200 bg-amber-50/10" : "border-slate-100"
                }`}>
                  <div className="flex items-center gap-4">
                    {/* Urgent bar */}
                    {isUrgent && <div className="flex-shrink-0 w-1 h-12 rounded-full bg-amber-400" />}

                    {/* Title + campaign */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {isUrgent && <span className="material-symbols-outlined text-amber-500 text-[15px]">warning</span>}
                        <span className="text-sm font-semibold text-anthracite truncate">{ct.title}</span>
                      </div>
                      <p className="text-2xs text-slate-400 truncate">
                        {ct.calendarEntry.campaign.name}
                      </p>
                    </div>

                    {/* Platform */}
                    <div className="flex-shrink-0">
                      <PlatformBadge platform={ct.calendarEntry.platform} />
                    </div>

                    {/* Status */}
                    <div className="flex-shrink-0 w-36">
                      <ContentStatusBadge status={ct.status} />
                    </div>

                    {/* Team */}
                    <div className="flex-shrink-0">
                      <TeamBadge team={ct.assignedTeam} />
                    </div>

                    {/* Assets */}
                    <div className="flex-shrink-0 flex items-center gap-1 text-slate-400">
                      <span className="material-symbols-outlined text-[14px]">attach_file</span>
                      <span className="text-xs">{ct._count.assets}</span>
                    </div>

                    {/* Tasks */}
                    <div className="flex-shrink-0 flex items-center gap-1 text-slate-400">
                      <span className="material-symbols-outlined text-[14px]">task_alt</span>
                      <span className="text-xs">{ct._count.tasks}</span>
                    </div>

                    {/* Deadline */}
                    <div className={`flex-shrink-0 flex items-center gap-1 text-xs font-medium ${isUrgent ? "text-amber-600" : "text-slate-400"}`}>
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {daysLeft === 0 ? "Aujourd'hui" : daysLeft < 0 ? "En retard" : `J-${daysLeft}`}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
