import { prisma } from "@/lib/db";
import IORedis from "ioredis";

type HealthStatus = "ok" | "error" | "unknown";
interface HealthCheck { name: string; icon: string; desc: string; status: HealthStatus; latency: number; detail?: string }

async function runHealthChecks(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = [];

  // PostgreSQL
  const pgStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.push({ name: "PostgreSQL", icon: "database", desc: "Base de données principale", status: "ok", latency: Date.now() - pgStart });
  } catch (e) {
    checks.push({ name: "PostgreSQL", icon: "database", desc: "Base de données principale", status: "error", latency: Date.now() - pgStart, detail: (e as Error).message });
  }

  // Redis
  const redisStart = Date.now();
  try {
    const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", { maxRetriesPerRequest: 1, connectTimeout: 3000, lazyConnect: true });
    await redis.connect();
    await redis.ping();
    await redis.disconnect();
    checks.push({ name: "Redis / BullMQ", icon: "memory", desc: "File de tâches BullMQ", status: "ok", latency: Date.now() - redisStart });
  } catch (e) {
    checks.push({ name: "Redis / BullMQ", icon: "memory", desc: "File de tâches BullMQ", status: "error", latency: Date.now() - redisStart, detail: (e as Error).message });
  }

  // Next.js (always ok — we're running)
  checks.push({ name: "Next.js", icon: "electrical_services", desc: "Application web", status: "ok", latency: 0 });

  // Email queue depth (Resend key presence as proxy)
  const emailStart = Date.now();
  try {
    const pendingEmails = await prisma.auditLog.count({ where: { action: "STATUS_CHANGED", createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
    checks.push({ name: "Email Worker", icon: "queue", desc: `${pendingEmails} transitions (24h)`, status: process.env.RESEND_API_KEY ? "ok" : "error", latency: Date.now() - emailStart, detail: process.env.RESEND_API_KEY ? undefined : "RESEND_API_KEY manquant" });
  } catch {
    checks.push({ name: "Email Worker", icon: "queue", desc: "Processeur de jobs", status: "unknown", latency: Date.now() - emailStart });
  }

  return checks;
}

export default async function SystemsMonitorPage() {
  const [auditLogs, healthChecks] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { name: true, email: true } } },
    }).catch(() => []),
    runHealthChecks(),
  ]);

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
              {healthChecks.map(s => {
                const isOk      = s.status === "ok";
                const isError   = s.status === "error";
                const dotColor  = isOk ? "bg-emerald-500" : isError ? "bg-red-500" : "bg-amber-400";
                const textColor = isOk ? "text-emerald-600" : isError ? "text-red-600" : "text-amber-600";
                const label     = isOk ? "Opérationnel" : isError ? "Erreur" : "Inconnu";
                return (
                  <div key={s.name} className={`flex items-center gap-4 p-3 rounded-lg ${isError ? "bg-red-50" : "bg-slate-50"}`}>
                    <span className="material-symbols-outlined text-slate-400 text-[20px]">{s.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-anthracite">{s.name}</p>
                      <p className="text-2xs text-slate-400 truncate">{s.detail ?? s.desc}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {s.latency > 0 && (
                        <span className="text-2xs text-slate-400">{s.latency}ms</span>
                      )}
                      <span className={`flex items-center gap-1.5 text-xs font-bold ${textColor}`}>
                        <span className={`w-2 h-2 rounded-full inline-block ${dotColor}`} />
                        {label}
                      </span>
                    </div>
                  </div>
                );
              })}
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
