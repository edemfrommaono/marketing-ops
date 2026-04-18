import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentStatusBadge, TeamBadge } from "@/components/ui/StatusBadge";
import { PlatformBadge } from "@/components/editorial/PlatformBadge";
import { ContentStatus } from "@prisma/client";
import { getContentById } from "@/lib/data/contents";

const LIFECYCLE: { status: ContentStatus; label: string }[] = [
  { status: "DRAFT",             label: "Brouillon"        },
  { status: "IN_PRODUCTION",     label: "Production"       },
  { status: "INTERNAL_REVIEW",   label: "Révision interne" },
  { status: "CLIENT_REVIEW",     label: "Révision client"  },
  { status: "APPROVED",          label: "Approuvé"         },
  { status: "SCHEDULED",         label: "Planifié"         },
  { status: "PUBLISHED",         label: "Publié"           },
];

const TASK_STATUS_STYLES: Record<string, string> = {
  COMPLETED:   "bg-emerald-50 text-emerald-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  PENDING:     "bg-slate-100 text-slate-500",
  BLOCKED:     "bg-red-50 text-red-700",
};
const TASK_STATUS_LABELS: Record<string, string> = {
  COMPLETED: "Terminé", IN_PROGRESS: "En cours", PENDING: "À faire", BLOCKED: "Bloqué",
};
const PRIORITY_STYLES: Record<string, string> = {
  HIGH:   "text-red-500",
  MEDIUM: "text-amber-500",
  LOW:    "text-slate-400",
};
const APPROVAL_STATUS_STYLES: Record<string, string> = {
  PENDING:           "bg-amber-50 text-amber-700",
  APPROVED:          "bg-emerald-50 text-emerald-700",
  REJECTED:          "bg-red-50 text-red-700",
  REVISION_REQUIRED: "bg-orange-50 text-orange-700",
};

function getLifecycleStep(status: ContentStatus): number {
  return LIFECYCLE.findIndex(s => s.status === status);
}

export default async function ContentDetailPage({ params }: { params: { id: string } }) {
  const content = await getContentById(params.id);

  if (content === null) {
    notFound();
  }

  const now = new Date();
  const deadline = content.deadline ? new Date(content.deadline) : null;
  const daysLeft = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / 86400000) : null;
  const isUrgent = daysLeft !== null && daysLeft <= 2 && content.status !== "PUBLISHED";

  const deadlineDisplay = deadline
    ? deadline.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  const createdAtDisplay = content.createdAt
    ? new Date(content.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  const tasks = content.tasks ?? [];
  const doneTasks = tasks.filter(t => t.status === "COMPLETED").length;
  const progressPct = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const assets = content.assets ?? [];
  const approvals = content.approvals ?? [];
  const auditLogs = content.auditLogs ?? [];

  const currentStep = getLifecycleStep(content.status);

  const platform   = content.calendarEntry?.platform ?? null;
  const campaign   = content.calendarEntry?.campaign ?? null;
  const clientName = content.calendarEntry?.campaign?.client?.name ?? "—";

  return (
    <div className="flex-1 min-h-screen">
      <main className="px-8 py-8 max-w-[1400px] mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <Link href="/contents" className="hover:text-anthracite transition-colors">File de production</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-anthracite font-medium truncate">{content.title}</span>
        </div>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              {isUrgent && (
                <span className="flex items-center gap-1 text-2xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  <span className="material-symbols-outlined text-[12px]">warning</span>URGENT
                </span>
              )}
              <ContentStatusBadge status={content.status} />
              {platform && <PlatformBadge platform={platform} />}
              {content.assignedTeam && <TeamBadge team={content.assignedTeam} />}
            </div>
            <h1 className="text-2xl font-bold text-anthracite mb-1">{content.title}</h1>
            <p className="text-sm text-slate-400">
              {campaign ? (
                <Link href={`/campaigns/${campaign.id}`} className="hover:text-editorial transition-colors">{campaign.name}</Link>
              ) : "—"}
              {" · "}{clientName}{" · "}Créé le {createdAtDisplay}
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link href={`/contents/${params.id}/assets`} className="flex items-center gap-2 h-9 px-4 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-[16px]">attach_file</span>Assets
            </Link>
            <button className="flex items-center gap-2 h-9 px-4 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-[16px]">edit</span>Modifier
            </button>
            <Link href={`/approvals/${params.id}`} className="flex items-center gap-2 h-9 px-4 bg-editorial text-white rounded-lg text-sm font-semibold hover:bg-editorial/90 transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[16px]">rate_review</span>Envoyer en révision
            </Link>
          </div>
        </div>

        {/* Lifecycle stepper */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-6 mb-6">
          <div className="flex items-center justify-between relative">
            {/* connector line */}
            <div className="absolute left-0 right-0 top-4 h-0.5 bg-slate-100 z-0" />
            <div
              className="absolute left-0 top-4 h-0.5 bg-editorial z-0 transition-all"
              style={{ width: currentStep > 0 ? `${(currentStep / (LIFECYCLE.length - 1)) * 100}%` : "0%" }}
            />
            {LIFECYCLE.map((step, i) => {
              const done   = i < currentStep;
              const active = i === currentStep;
              return (
                <div key={step.status} className="flex flex-col items-center gap-2 z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                    done   ? "bg-editorial border-editorial" :
                    active ? "bg-white border-editorial shadow-md shadow-editorial/20" :
                             "bg-white border-slate-200"
                  }`}>
                    {done
                      ? <span className="material-symbols-outlined text-white text-[16px]">check</span>
                      : active
                      ? <div className="w-3 h-3 rounded-full bg-editorial" />
                      : <div className="w-2 h-2 rounded-full bg-slate-200" />
                    }
                  </div>
                  <span className={`text-2xs font-semibold whitespace-nowrap ${
                    active ? "text-editorial" : done ? "text-anthracite" : "text-slate-400"
                  }`}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Brief */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Brief créatif</h3>
              <p className="text-sm text-anthracite leading-relaxed">{content.briefNotes ?? content.briefUrl ?? "—"}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">Format: {content.format}</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">Deadline: {deadlineDisplay}</span>
              </div>
            </div>

            {/* Tasks */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-soft overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-anthracite">Tâches de production</h3>
                  <p className="text-2xs text-slate-400 mt-0.5">{doneTasks}/{tasks.length} terminées · {progressPct}%</p>
                </div>
                <button className="flex items-center gap-1 text-xs font-semibold text-editorial hover:underline">
                  <span className="material-symbols-outlined text-[14px]">add</span>Ajouter
                </button>
              </div>
              {/* progress bar */}
              <div className="h-1 bg-slate-100">
                <div className="h-1 bg-editorial transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="divide-y divide-slate-50">
                {tasks.length === 0 && (
                  <p className="px-6 py-4 text-xs text-slate-400">Aucune tâche.</p>
                )}
                {tasks.map(task => (
                  <div key={task.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50 group">
                    <span className={`material-symbols-outlined text-[18px] flex-shrink-0 ${
                      task.status === "COMPLETED" ? "text-emerald-500" : "text-slate-300 group-hover:text-slate-400"
                    }`}>{task.status === "COMPLETED" ? "check_circle" : "radio_button_unchecked"}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.status === "COMPLETED" ? "line-through text-slate-400" : "text-anthracite"}`}>
                        {task.title}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 px-2 py-0.5 rounded text-2xs font-bold ${TASK_STATUS_STYLES[task.status] ?? ""}`}>
                      {TASK_STATUS_LABELS[task.status] ?? task.status}
                    </span>
                    <span className="flex-shrink-0 text-xs text-slate-400">{task.assignedTo?.name ?? "—"}</span>
                    <span className="flex-shrink-0 text-xs text-slate-400">
                      {task.deadline ? new Date(task.deadline).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assets */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-soft overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-anthracite">Assets ({assets.length})</h3>
                <Link href={`/contents/${params.id}/assets`} className="flex items-center gap-1 text-xs font-semibold text-editorial hover:underline">
                  <span className="material-symbols-outlined text-[14px]">upload</span>Uploader
                </Link>
              </div>
              <div className="divide-y divide-slate-50">
                {assets.length === 0 && (
                  <p className="px-6 py-4 text-xs text-slate-400">Aucun asset.</p>
                )}
                {assets.map(asset => (
                  <div key={asset.id} className="px-6 py-3 flex items-center gap-4 hover:bg-slate-50">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      asset.assetType === "VIDEO" ? "bg-blue-50" : asset.assetType === "IMAGE" ? "bg-purple-50" : "bg-slate-50"
                    }`}>
                      <span className={`material-symbols-outlined text-[18px] ${
                        asset.assetType === "VIDEO" ? "text-blue-500" : asset.assetType === "IMAGE" ? "text-purple-500" : "text-slate-400"
                      }`}>{asset.assetType === "VIDEO" ? "video_file" : asset.assetType === "IMAGE" ? "image" : "description"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-anthracite truncate">{asset.fileName}</p>
                      <p className="text-2xs text-slate-400">
                        {asset.fileSize ? `${(asset.fileSize / (1024 * 1024)).toFixed(1)} MB` : "—"} · v{asset.version} · {new Date(asset.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    {asset.isActive
                      ? <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-2xs font-bold">Actif</span>
                      : <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-2xs font-bold">Archivé</span>
                    }
                    <button className="text-slate-400 hover:text-editorial transition-colors">
                      <span className="material-symbols-outlined text-[18px]">download</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Approval status */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Approbations</h4>
              <div className="space-y-3">
                {approvals.length === 0 && (
                  <p className="text-xs text-slate-400">Aucune approbation en cours.</p>
                )}
                {approvals.map((approval, i) => (
                  <div key={i} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-anthracite">Révision interne</span>
                      <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${APPROVAL_STATUS_STYLES[approval.internalStatus] ?? ""}`}>
                        {approval.internalStatus === "APPROVED" ? "Approuvé"
                          : approval.internalStatus === "REJECTED" ? "Refusé"
                          : approval.internalStatus === "REVISION_REQUIRED" ? "Révision"
                          : "En attente"}
                      </span>
                    </div>
                    <p className="text-2xs text-slate-400">{approval.reviewedBy?.name ?? "—"}</p>
                    {approval.internalNote && (
                      <p className="text-xs text-slate-500 mt-2 bg-white rounded p-2 border border-slate-100">{approval.internalNote}</p>
                    )}
                    {approval.clientStatus && (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-anthracite">Révision client</span>
                        <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${APPROVAL_STATUS_STYLES[approval.clientStatus] ?? ""}`}>
                          {approval.clientStatus === "APPROVED" ? "Approuvé"
                            : approval.clientStatus === "REJECTED" ? "Refusé"
                            : approval.clientStatus === "REVISION_REQUIRED" ? "Révision"
                            : "En attente"}
                        </span>
                      </div>
                    )}
                    {approval.clientNote && (
                      <p className="text-xs text-slate-500 mt-2 bg-white rounded p-2 border border-slate-100">{approval.clientNote}</p>
                    )}
                  </div>
                ))}
              </div>
              <Link href={`/approvals/${params.id}`} className="mt-4 flex items-center justify-center gap-2 w-full py-2 border border-editorial text-editorial rounded-lg text-xs font-semibold hover:bg-editorial/5 transition-colors">
                <span className="material-symbols-outlined text-[14px]">rate_review</span>Lancer la révision
              </Link>
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Métadonnées</h4>
              <div className="space-y-3">
                {[
                  {
                    label: "Plateforme",
                    value: platform
                      ? <PlatformBadge platform={platform} />
                      : <span className="text-xs text-slate-400">—</span>,
                  },
                  {
                    label: "Équipe",
                    value: content.assignedTeam
                      ? <TeamBadge team={content.assignedTeam} />
                      : <span className="text-xs text-slate-400">—</span>,
                  },
                  {
                    label: "Deadline",
                    value: <span className="text-xs font-medium text-amber-600">{deadlineDisplay}</span>,
                  },
                  {
                    label: "Format",
                    value: <span className="text-xs text-slate-600">{content.format}</span>,
                  },
                  {
                    label: "Campagne",
                    value: campaign
                      ? <Link href={`/campaigns/${campaign.id}`} className="text-xs text-editorial hover:underline">{campaign.name}</Link>
                      : <span className="text-xs text-slate-400">—</span>,
                  },
                  {
                    label: "Client",
                    value: <span className="text-xs text-slate-600">{clientName}</span>,
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
                    {value}
                  </div>
                ))}
              </div>
            </div>

            {/* Activity feed */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Activité récente</h4>
              <div className="space-y-3">
                {auditLogs.length === 0 && (
                  <p className="text-xs text-slate-400">Aucune activité.</p>
                )}
                {auditLogs.map((log, i) => {
                  const userName = log.user?.name ?? "Système";
                  return (
                    <div key={i} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-editorial/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-editorial">{userName[0]}</span>
                      </div>
                      <div>
                        <p className="text-xs text-anthracite">
                          <span className="font-semibold">{userName}</span> {log.action}
                        </p>
                        <p className="text-2xs text-slate-400 mt-0.5">
                          {new Date(log.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric", month: "short",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
