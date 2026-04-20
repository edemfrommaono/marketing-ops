import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ContentStatus, Platform, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { enqueueEmail } from "@/lib/queue/enqueue";

// ── Derived types ─────────────────────────────────────────────────────────────
type PortalContent = Prisma.ContentGetPayload<{
  include: { approvals: true; publication: true };
}> & { campaignName: string; platform: Platform };

// ── Server Action — client approval ──────────────────────────────────────────
async function clientApproveAction(formData: FormData) {
  "use server";
  const contentId = formData.get("contentId") as string | null;
  if (!contentId) return;

  const comment = (formData.get("comment") as string | null) ?? undefined;
  const existing = await prisma.approval.findFirst({ where: { contentId } });
  if (existing) {
    await prisma.approval.update({
      where: { id: existing.id },
      data: { clientStatus: "APPROVED", reviewedAt: new Date(), clientNote: comment },
    });
  } else {
    await prisma.approval.create({
      data: {
        contentId,
        internalStatus: "PENDING",
        clientStatus: "APPROVED",
        reviewedAt: new Date(),
        clientNote: comment,
      },
    });
  }

  const content = await prisma.content.update({
    where: { id: contentId },
    data: { status: "APPROVED" as ContentStatus },
    select: { title: true },
  });

  // Notify internal team that client approved
  const tasks = await prisma.productionTask.findMany({
    where: { contentId },
    include: { assignedTo: { select: { email: true, name: true } } },
  });
  for (const task of tasks) {
    if (task.assignedTo?.email) {
      await enqueueEmail({
        type: "content-approved",
        recipientEmail: task.assignedTo.email,
        recipientName:  task.assignedTo.name || undefined,
        data: {
          contentTitle: content.title,
          approverName: "Le client",
          contentLink:  `${process.env.NEXTAUTH_URL}/contents/${contentId}`,
          nextStep:     "Le client a approuvé le contenu. Il peut être planifié pour publication.",
        },
      });
    }
  }

  const token = (formData.get("token") as string) ?? "";
  revalidatePath(`/client/${token}`);
}

// ── Server Action — client request revision ───────────────────────────────────
async function clientRequestRevisionAction(formData: FormData) {
  "use server";
  const contentId = formData.get("contentId") as string | null;
  if (!contentId) return;

  const comment = (formData.get("comment") as string | null) ?? undefined;
  const existing = await prisma.approval.findFirst({ where: { contentId } });
  if (existing) {
    await prisma.approval.update({
      where: { id: existing.id },
      data: { clientStatus: "REVISION_REQUIRED", reviewedAt: new Date(), clientNote: comment },
    });
  } else {
    await prisma.approval.create({
      data: {
        contentId,
        internalStatus: "PENDING",
        clientStatus: "REVISION_REQUIRED",
        reviewedAt: new Date(),
        clientNote: comment,
      },
    });
  }

  const content = await prisma.content.update({
    where: { id: contentId },
    data: { status: "REVISION_REQUIRED" as ContentStatus },
    select: { title: true },
  });

  // Notify internal team of revision request
  const tasks = await prisma.productionTask.findMany({
    where: { contentId },
    include: { assignedTo: { select: { email: true, name: true } } },
  });
  for (const task of tasks) {
    if (task.assignedTo?.email) {
      await enqueueEmail({
        type: "revision-required",
        recipientEmail: task.assignedTo.email,
        recipientName:  task.assignedTo.name || undefined,
        data: {
          contentTitle: content.title,
          reviewerName: "Le client",
          comment:      comment || "Le client demande des modifications. Consultez le portail client pour plus de détails.",
          contentLink:  `${process.env.NEXTAUTH_URL}/contents/${contentId}`,
        },
      });
    }
  }

  const token = (formData.get("token") as string) ?? "";
  revalidatePath(`/client/${token}`);
}

// ── Helper maps ───────────────────────────────────────────────────────────────
const PLATFORM_ICONS: Record<string, string> = {
  INSTAGRAM: "photo_camera",
  LINKEDIN: "business_center",
  YOUTUBE: "play_circle",
  FACEBOOK: "thumb_up",
  TIKTOK: "music_note",
  X: "close",
};
const PLATFORM_COLORS: Record<string, string> = {
  INSTAGRAM: "text-pink-500 bg-pink-50",
  LINKEDIN: "text-blue-600 bg-blue-50",
  YOUTUBE: "text-red-500 bg-red-50",
  FACEBOOK: "text-blue-500 bg-blue-50",
  TIKTOK: "text-slate-800 bg-slate-100",
  X: "text-slate-700 bg-slate-100",
};
const STATUS_LABELS: Record<ContentStatus, string> = {
  DRAFT: "Brouillon",
  IN_PRODUCTION: "En production",
  INTERNAL_REVIEW: "Révision interne",
  CLIENT_REVIEW: "En attente de votre validation",
  APPROVED: "Approuvé",
  REVISION_REQUIRED: "Révision requise",
  SCHEDULED: "Planifié",
  PUBLISHED: "Publié",
  ARCHIVED: "Archivé",
};

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function ClientPortalPage({
  params,
}: {
  params: { token: string };
}) {
  // ── DB lookup ──
  let portalToken;
  try {
    portalToken = await prisma.clientPortalToken.findUnique({
      where: { token: params.token },
      include: {
        client: {
          include: {
            campaigns: {
              include: {
                calendarEntries: {
                  include: {
                    contents: {
                      include: {
                        approvals: true,
                        publication: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  } catch {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-sm text-center p-8">
          <span className="material-symbols-outlined text-[48px] text-slate-300 mb-4 block">cloud_off</span>
          <h1 className="text-lg font-bold text-anthracite mb-2">Service temporairement indisponible</h1>
          <p className="text-sm text-slate-500">
            Nous ne pouvons pas traiter votre demande pour le moment. Veuillez réessayer dans quelques instants.
          </p>
        </div>
      </div>
    );
  }

  if (!portalToken || !portalToken.isActive) {
    notFound();
  }

  // ── Expired token ──
  if (portalToken.expiresAt && portalToken.expiresAt < new Date()) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-sm text-center p-8">
          <span className="material-symbols-outlined text-[48px] text-amber-400 mb-4 block">timer_off</span>
          <h1 className="text-lg font-bold text-anthracite mb-2">Accès expiré</h1>
          <p className="text-sm text-slate-500">
            Ce lien de portail n&apos;est plus valide. Veuillez contacter votre chargé de compte Maono pour obtenir un nouveau lien.
          </p>
        </div>
      </div>
    );
  }

  const client = portalToken.client;

  // Flatten all contents across all campaigns
  const allContents: PortalContent[] = client.campaigns.flatMap((campaign) =>
    campaign.calendarEntries.flatMap((entry) =>
      entry.contents.map((content) => ({
        ...content,
        campaignName: campaign.name,
        platform: entry.platform,
      }))
    )
  );

  const contentsAwaiting = allContents.filter(
    (c) => c.status === "CLIENT_REVIEW"
  );
  const contentsPublished = allContents.filter(
    (c) => c.status === "PUBLISHED" && c.publication
  );

  // Use first active campaign for overview (fallback to first)
  const activeCampaign =
    client.campaigns.find((c) => c.status === "ACTIVE") ??
    client.campaigns[0] ??
    null;

  const totalContents = allContents.length;
  const approvedContents = allContents.filter(
    (c) => c.status === "APPROVED" || c.status === "PUBLISHED" || c.status === "SCHEDULED"
  ).length;
  const campaignProgress =
    totalContents > 0 ? Math.round((approvedContents / totalContents) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <div>
              <p className="text-xs text-slate-400 leading-none">Portail client</p>
              <p className="text-sm font-bold text-anthracite leading-tight">
                Maono × {client.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="material-symbols-outlined text-[14px] text-emerald-500">lock</span>
            Accès sécurisé
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Campaign overview */}
        {activeCampaign ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Campagne en cours
                </p>
                <h1 className="text-xl font-bold text-anthracite">{activeCampaign.name}</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeCampaign.startDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  {" → "}
                  {activeCampaign.endDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                Actif
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              {activeCampaign.objective}
            </p>
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Progression globale</span>
                <span className="font-bold text-anthracite">{campaignProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="h-2 rounded-full bg-editorial"
                  style={{ width: `${campaignProgress}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6 text-sm text-slate-400">
            Aucune campagne active pour le moment.
          </div>
        )}

        {/* Awaiting validation */}
        {contentsAwaiting.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-bold text-anthracite">
                Contenus en attente de validation
              </h2>
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {contentsAwaiting.length}
              </span>
            </div>
            <div className="space-y-4">
              {contentsAwaiting.map((ct) => {
                const isUrgent =
                  ct.deadline < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
                const deadlineLabel = ct.deadline.toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                });
                const platformColor =
                  PLATFORM_COLORS[ct.platform] ?? "text-slate-500 bg-slate-100";
                const platformIcon =
                  PLATFORM_ICONS[ct.platform] ?? "image";

                return (
                  <div
                    key={ct.id}
                    className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                      isUrgent ? "border-amber-200" : "border-slate-200"
                    }`}
                  >
                    {isUrgent && (
                      <div className="bg-amber-50 border-b border-amber-100 px-5 py-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500 text-[16px]">
                          warning
                        </span>
                        <span className="text-xs font-bold text-amber-700">
                          Validation requise avant le {deadlineLabel}
                        </span>
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${platformColor}`}
                        >
                          <span className="material-symbols-outlined text-[24px]">
                            {platformIcon}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-base font-semibold text-anthracite mb-0.5">
                                {ct.title}
                              </h3>
                              <p className="text-xs text-slate-400">
                                {ct.platform} · {ct.format} · Deadline:{" "}
                                <span
                                  className={
                                    isUrgent
                                      ? "text-amber-600 font-semibold"
                                      : ""
                                  }
                                >
                                  {deadlineLabel}
                                </span>
                              </p>
                            </div>
                            <span className="flex-shrink-0 bg-violet-50 text-violet-700 text-2xs font-bold px-2 py-0.5 rounded-full">
                              {STATUS_LABELS[ct.status]}
                            </span>
                          </div>
                          {ct.briefNotes && (
                            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                              {ct.briefNotes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action area */}
                      <form action={clientApproveAction}>
                        <input type="hidden" name="contentId" value={ct.id} />
                        <input type="hidden" name="token" value={params.token} />
                        <div className="mt-5 pt-4 border-t border-slate-100">
                          <div className="mb-3">
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                              Commentaire (optionnel)
                            </label>
                            <textarea
                              name="comment"
                              rows={2}
                              placeholder="Vos remarques pour l'équipe..."
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-anthracite placeholder-slate-300 focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none resize-none"
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              type="submit"
                              name="action"
                              value="approve"
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                check_circle
                              </span>
                              Approuver
                            </button>
                          </div>
                        </div>
                      </form>
                      <form action={clientRequestRevisionAction}>
                        <input type="hidden" name="contentId" value={ct.id} />
                        <input type="hidden" name="token" value={params.token} />
                        <button
                          type="submit"
                          className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-amber-400 text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-50 transition-colors mt-2"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            edit
                          </span>
                          Demander modifications
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Published content */}
        {contentsPublished.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-anthracite mb-4">
              Contenus publiés ({contentsPublished.length})
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
              {contentsPublished.map((ct) => {
                const platformColor =
                  PLATFORM_COLORS[ct.platform] ?? "text-slate-500 bg-slate-100";
                const platformIcon = PLATFORM_ICONS[ct.platform] ?? "image";
                const publishedOn = ct.publication!.publishedAt.toLocaleDateString(
                  "fr-FR",
                  { day: "numeric", month: "short" }
                );
                return (
                  <div
                    key={ct.id}
                    className="px-5 py-4 flex items-center gap-4"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${platformColor}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {platformIcon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-anthracite truncate">
                        {ct.title}
                      </p>
                      <p className="text-2xs text-slate-400">
                        Publié le {publishedOn}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-2xs font-bold flex-shrink-0">
                      Publié
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400">
            Portail sécurisé Maono · Ce lien est personnel et confidentiel
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Questions ? Contactez votre chargé de compte Maono
          </p>
        </div>
      </div>
    </div>
  );
}
