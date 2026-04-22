import Link from "next/link";
import { ContentStatusBadge, TeamBadge } from "@/components/ui/StatusBadge";
import { PlatformBadge } from "@/components/editorial/PlatformBadge";
import { ContentStatus } from "@/types/api";
import { getPublishingQueue } from "@/lib/data/contents";

export default async function PublishingPage() {
  const { contents } = await getPublishingQueue();

  const approved   = contents.filter(c => c.status === ContentStatus.APPROVED);
  const scheduled  = contents.filter(c => c.status === ContentStatus.SCHEDULED);
  const now        = new Date();
  const urgent     = contents.filter(c => {
    const diff = (new Date(c.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 1;
  }).length;

  const isEmpty = contents.length === 0;

  return (
    <div className="flex-1 min-h-screen">
      <main className="px-8 py-8 max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-anthracite mb-1">File de publication</h2>
            <p className="text-slate-400 text-sm">
              {contents.length} contenus
              {approved.length  > 0 && <> · <span className="text-emerald-600 font-medium">{approved.length} approuvés</span></>}
              {scheduled.length > 0 && <> · <span className="text-sky-600 font-medium">{scheduled.length} planifiés</span></>}
              {urgent > 0            && <> · <span className="text-amber-600 font-medium">{urgent} urgents</span></>}
            </p>
          </div>
        </div>

        {/* Empty */}
        {isEmpty && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4 block">send</span>
            <p className="text-sm font-medium text-slate-500 mb-1">Aucun contenu prêt à publier</p>
            <p className="text-xs text-slate-400">Les contenus approuvés apparaîtront ici.</p>
          </div>
        )}

        {/* Approved — ready to publish */}
        {approved.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Prêts à publier ({approved.length})</h3>
            <div className="space-y-3">
              {approved.map(ct => {
                const daysLeft = Math.ceil((new Date(ct.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const isUrgent = daysLeft <= 1;
                return (
                  <div key={ct.id} className={`bg-white rounded-xl border shadow-soft p-5 flex items-center gap-5 hover:shadow-md transition-all ${
                    isUrgent ? "border-amber-200 bg-amber-50/20" : "border-emerald-100 bg-emerald-50/10"
                  }`}>
                    {isUrgent && <div className="flex-shrink-0 w-1 h-12 rounded-full bg-amber-400" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {isUrgent && <span className="material-symbols-outlined text-amber-500 text-[16px]">warning</span>}
                        <h4 className="text-sm font-semibold text-anthracite truncate">{ct.title}</h4>
                      </div>
                      <p className="text-2xs text-slate-400">{ct.calendarEntry.campaign.name}</p>
                    </div>
                    <div className="flex-shrink-0"><PlatformBadge platform={ct.calendarEntry.platform} /></div>
                    <div className="flex-shrink-0 w-28"><ContentStatusBadge status={ct.status} /></div>
                    <div className="flex-shrink-0"><TeamBadge team={ct.assignedTeam} /></div>
                    <div className={`flex-shrink-0 flex items-center gap-1 text-xs font-medium ${isUrgent ? "text-amber-600" : "text-slate-400"}`}>
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {daysLeft === 0 ? "Aujourd'hui" : daysLeft < 0 ? "En retard" : `J-${daysLeft}`}
                    </div>
                    <div className="flex-shrink-0 flex gap-2">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors">
                        <span className="material-symbols-outlined text-[14px]">calendar_add_on</span>Planifier
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm">
                        <span className="material-symbols-outlined text-[14px]">send</span>Publier
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scheduled */}
        {scheduled.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Planifiés ({scheduled.length})</h3>
            <div className="space-y-3">
              {scheduled.map(ct => (
                <div key={ct.id} className="bg-white rounded-xl border border-sky-100 bg-sky-50/10 shadow-soft p-5 flex items-center gap-5 hover:shadow-md transition-all">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-anthracite truncate mb-0.5">{ct.title}</h4>
                    <p className="text-2xs text-slate-400">{ct.calendarEntry.campaign.name}</p>
                  </div>
                  <div className="flex-shrink-0"><PlatformBadge platform={ct.calendarEntry.platform} /></div>
                  <div className="flex-shrink-0 w-28"><ContentStatusBadge status={ct.status} /></div>
                  <div className="flex-shrink-0"><TeamBadge team={ct.assignedTeam} /></div>
                  <div className="flex-shrink-0 flex items-center gap-1.5 text-sky-600">
                    <span className="material-symbols-outlined text-[14px]">calendar_clock</span>
                    <span className="text-xs font-semibold">
                      {new Date(ct.deadline).toLocaleDateString("fr-FR", { day:"numeric", month:"short" })}
                    </span>
                  </div>
                  <div className="flex-shrink-0 flex gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors">
                      <span className="material-symbols-outlined text-[14px]">edit_calendar</span>Modifier
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors">
                      <span className="material-symbols-outlined text-[14px]">cancel</span>Annuler
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
