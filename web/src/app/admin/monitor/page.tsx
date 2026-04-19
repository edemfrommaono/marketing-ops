import { prisma } from "@/lib/db";

export default async function SystemsMonitorPage() {
  // Real audit log entries
  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { user: { select: { name: true, email: true } } },
  }).catch(() => []);

  return (
    <div className="mx-auto max-w-7xl space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-primary sm:text-4xl">Systems Monitor</h2>
          <p className="mt-1 text-base text-slate-500">Activité système, logs et état de l'infrastructure.</p>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-12 gap-6">

        {/* ── Left column — infrastructure status ── */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">

          {/* Infrastructure health */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">État de l'infrastructure</h3>
            <div className="space-y-3">
              {[
                { name: "PostgreSQL",  icon: "database",            desc: "Base de données principale"     },
                { name: "Redis",       icon: "memory",              desc: "File de tâches BullMQ"           },
                { name: "MinIO",       icon: "cloud_upload",        desc: "Stockage fichiers / assets"      },
                { name: "Next.js",     icon: "electrical_services", desc: "Application web"                 },
                { name: "Worker",      icon: "queue",               desc: "Processeur de jobs en arrière-plan" },
              ].map(s => (
                <div key={s.name} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">{s.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-anthracite">{s.name}</p>
                    <p className="text-2xs text-slate-400">{s.desc}</p>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    Opérationnel
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Incidents — empty state (no Incident model yet) */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Incidents actifs</h3>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="material-symbols-outlined text-emerald-400 text-[40px] mb-3">check_circle</span>
              <p className="text-sm font-semibold text-slate-600">Aucun incident signalé</p>
              <p className="text-xs text-slate-400 mt-1">Tous les services fonctionnent normalement.</p>
            </div>
          </div>

          {/* Releases — empty state */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Historique des releases</h3>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="material-symbols-outlined text-slate-300 text-[40px] mb-3">deploy</span>
              <p className="text-sm font-semibold text-slate-500">Aucune release enregistrée</p>
              <p className="text-xs text-slate-400 mt-1">L'historique des déploiements apparaîtra ici.</p>
            </div>
          </div>
        </div>

        {/* ── Right column — Activity log ── */}
        <div className="col-span-12 lg:col-span-4">
          <div className="h-full rounded-xl border border-slate-200 bg-white shadow-card overflow-hidden flex flex-col">
            <div className="border-b border-slate-100 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-primary">Journal d'activité</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {auditLogs.length}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {auditLogs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <span className="material-symbols-outlined text-slate-300 text-[36px] mb-2">history</span>
                  <p className="text-sm text-slate-400">Aucune activité enregistrée.</p>
                </div>
              )}
              {auditLogs.map(log => {
                const actor = log.user?.name ?? log.user?.email ?? "Système";
                const date  = new Date(log.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                });
                return (
                  <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-editorial/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-editorial">{actor[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-anthracite">
                          {log.action}
                          {" "}
                          <span className="text-slate-400 font-normal">{log.entityType}</span>
                        </p>
                        <p className="text-2xs text-slate-400 mt-0.5">{actor} · {date}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
