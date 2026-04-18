import Link from "next/link";
import { ContentStatusBadge, TeamBadge } from "@/components/ui/StatusBadge";
import { PlatformBadge } from "@/components/editorial/PlatformBadge";
import { ContentStatus } from "@prisma/client";
import { getApprovalsQueue } from "@/lib/data/contents";

const REVIEW_TYPE_STYLES: Record<string, string> = {
  INTERNAL: "bg-purple-50 text-purple-700",
  CLIENT:   "bg-violet-50 text-violet-700",
};

export default async function ApprovalsPage() {
  const { contents } = await getApprovalsQueue();

  const now = new Date();
  const withMeta = contents.map(ct => {
    const daysLeft = Math.ceil((new Date(ct.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isUrgent = daysLeft <= 2;
    const reviewType = ct.status === ContentStatus.INTERNAL_REVIEW ? "INTERNAL" : "CLIENT";
    return { ...ct, daysLeft, isUrgent, reviewType };
  });

  const urgent   = withMeta.filter(c => c.isUrgent).length;
  const internal = withMeta.filter(c => c.reviewType === "INTERNAL").length;
  const client   = withMeta.filter(c => c.reviewType === "CLIENT").length;
  const isEmpty  = contents.length === 0;

  return (
    <div className="flex-1 min-h-screen">
      <main className="px-8 py-8 max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-anthracite mb-1">File d'approbation</h2>
            <p className="text-slate-400 text-sm">
              {contents.length} en attente
              {urgent   > 0 && <> · <span className="text-amber-600 font-medium">{urgent} urgents</span></>}
              {internal > 0 && <> · <span className="text-purple-600 font-medium">{internal} révisions internes</span></>}
              {client   > 0 && <> · <span className="text-violet-600 font-medium">{client} révisions client</span></>}
            </p>
          </div>
        </div>

        {/* Stats */}
        {!isEmpty && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label:"En révision interne", value:internal, color:"bg-purple-50 border-purple-100", textColor:"text-purple-700", icon:"person_search" },
              { label:"En révision client",  value:client,   color:"bg-violet-50 border-violet-100", textColor:"text-violet-700", icon:"business"     },
              { label:"Urgents",             value:urgent,   color:"bg-amber-50 border-amber-100",   textColor:"text-amber-700",  icon:"warning"      },
            ].map(({ label, value, color, textColor, icon }) => (
              <div key={label} className={`rounded-xl border shadow-soft p-5 ${color} flex items-center gap-4`}>
                <span className={`material-symbols-outlined text-[28px] ${textColor}`}>{icon}</span>
                <div>
                  <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
                  <p className="text-xs font-medium text-slate-500">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-emerald-200 mb-4 block">check_circle</span>
            <p className="text-sm font-medium text-slate-500 mb-1">Aucune approbation en attente</p>
            <p className="text-xs text-slate-400">Tous les contenus sont à jour.</p>
          </div>
        )}

        {/* Queue */}
        {!isEmpty && (
          <div className="space-y-3">
            {withMeta.map(ct => (
              <div key={ct.id} className={`bg-white rounded-xl border shadow-soft p-5 flex items-center gap-5 hover:shadow-md transition-all ${
                ct.isUrgent ? "border-amber-200 bg-amber-50/20" : "border-slate-100"
              }`}>
                {ct.isUrgent && <div className="flex-shrink-0 w-1 h-14 rounded-full bg-amber-400" />}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {ct.isUrgent && <span className="material-symbols-outlined text-amber-500 text-[16px]">warning</span>}
                    <h4 className="text-sm font-semibold text-anthracite truncate">{ct.title}</h4>
                  </div>
                  <p className="text-2xs text-slate-400">{ct.calendarEntry.campaign.name}</p>
                </div>

                <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-2xs font-bold ${REVIEW_TYPE_STYLES[ct.reviewType]}`}>
                  {ct.reviewType === "INTERNAL" ? "Révision interne" : "Révision client"}
                </span>

                <div className="flex-shrink-0"><PlatformBadge platform={ct.calendarEntry.platform} /></div>
                <div className="flex-shrink-0 w-36"><ContentStatusBadge status={ct.status} /></div>
                <div className="flex-shrink-0"><TeamBadge team={ct.assignedTeam} /></div>

                <div className={`flex-shrink-0 flex items-center gap-1 text-xs font-medium ${ct.isUrgent ? "text-amber-600" : "text-slate-400"}`}>
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  {ct.daysLeft === 0 ? "Aujourd'hui" : ct.daysLeft < 0 ? "En retard" : `J-${ct.daysLeft}`}
                </div>

                <Link href={`/approvals/${ct.id}`} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-editorial text-white rounded-lg text-xs font-semibold hover:bg-editorial/90 transition-colors">
                  <span className="material-symbols-outlined text-[14px]">rate_review</span>Réviser
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
