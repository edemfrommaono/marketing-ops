"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ContentStatus, ContentFormat, ProductionTeam, Platform, ContentType } from "@prisma/client";
import { enqueueEmail } from "@/lib/queue/enqueue";

export async function createContent(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const title           = formData.get("title")           as string;
  const calendarEntryId = formData.get("calendarEntryId") as string | null;
  const campaignId      = formData.get("campaignId")      as string;
  const platform        = formData.get("platform")        as Platform;
  const teamValue       = formData.get("team")            as ProductionTeam;
  const deadlineStr     = formData.get("deadline")        as string;
  const formatValue     = formData.get("format")          as ContentFormat;
  const briefNotes      = formData.get("briefNotes")      as string | null;
  const theme           = formData.get("theme")           as string | null;
  const contentType     = (formData.get("contentType")    as ContentType) || ContentType.POST;
  const isDraft         = formData.get("isDraft") === "true";

  try {
    // If no calendarEntryId provided, create a CalendarEntry first
    let entryId = calendarEntryId;
    if (!entryId && campaignId) {
      const entry = await prisma.calendarEntry.create({
        data: {
          publicationDate: deadlineStr ? new Date(deadlineStr) : new Date(),
          platform,
          contentType,
          theme: theme || title,
          campaignId,
        },
      });
      entryId = entry.id;
    }

    if (!entryId) throw new Error("calendarEntryId required");

    const content = await prisma.content.create({
      data: {
        title,
        format:          formatValue || ContentFormat.VIDEO,
        assignedTeam:    teamValue,
        deadline:        new Date(deadlineStr),
        status:          isDraft ? ContentStatus.DRAFT : ContentStatus.IN_PRODUCTION,
        briefNotes:      briefNotes ?? undefined,
        calendarEntryId: entryId,
      },
    });

    // Create an initial production task for the assigned team and notify
    if (teamValue && !isDraft) {
      // Find team members with the matching role to notify
      const teamMembers = await prisma.user.findMany({
        where: { role: teamValue as unknown as any },
        select: { id: true, email: true, name: true },
        take: 5,
      });

      // Create one task per team member found, or a generic unassigned task
      if (teamMembers.length > 0) {
        for (const member of teamMembers) {
          if (!member.email) continue;
          const task = await prisma.productionTask.create({
            data: {
              title:        `Production — ${title}`,
              type:         teamValue,
              contentId:    content.id,
              assignedToId: member.id,
              deadline:     new Date(deadlineStr),
            },
          });

          await enqueueEmail({
            type: "task-assigned",
            recipientEmail: member.email,
            recipientName:  member.name || undefined,
            data: {
              taskTitle:       task.title,
              taskDescription: briefNotes || `Nouveau contenu à produire : ${title}`,
              assigneeName:    member.name || member.email,
              deadline:        new Date(deadlineStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
              taskLink:        `${process.env.NEXTAUTH_URL}/contents/${content.id}`,
            },
          });
        }
      } else {
        // No specific members found — create unassigned task for tracking
        await prisma.productionTask.create({
          data: {
            title:     `Production — ${title}`,
            type:      teamValue,
            contentId: content.id,
            deadline:  new Date(deadlineStr),
          },
        });
      }
    }

    revalidatePath("/contents");
    redirect(`/contents/${content.id}`);
  } catch (err) {
    throw err;
  }
}

// ─── Complete a task and auto-advance content status ──────────────────────────

export async function completeTask(taskId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Non authentifié." };

  try {
    const task = await prisma.productionTask.findUnique({
      where: { id: taskId },
      select: { contentId: true, status: true },
    });

    if (!task) return { success: false, error: "Tâche introuvable." };
    if (task.status === "COMPLETED") return { success: true }; // idempotent

    // Mark task completed
    await prisma.productionTask.update({
      where: { id: taskId },
      data:  { status: "COMPLETED" },
    });

    // Check if ALL tasks for this content are now completed
    const [total, completed] = await Promise.all([
      prisma.productionTask.count({ where: { contentId: task.contentId } }),
      prisma.productionTask.count({ where: { contentId: task.contentId, status: "COMPLETED" } }),
    ]);

    if (total > 0 && total === completed) {
      // Auto-advance to INTERNAL_REVIEW
      const content = await prisma.content.findUnique({
        where: { id: task.contentId },
        select: { status: true, title: true, reviewerId: true },
      });

      if (content?.status === "IN_PRODUCTION") {
        await prisma.content.update({
          where: { id: task.contentId },
          data:  { status: ContentStatus.INTERNAL_REVIEW },
        });

        // Notify reviewer (explicit reviewer or fall back to ADMIN/STRATEGIST)
        const reviewerWhere = content.reviewerId
          ? { id: content.reviewerId }
          : undefined;

        const reviewers = reviewerWhere
          ? await prisma.user.findMany({ where: reviewerWhere, select: { email: true, name: true }, take: 1 })
          : await prisma.user.findMany({
              where: { role: { in: ["ADMIN", "STRATEGIST"] } },
              select: { email: true, name: true },
              take:   3,
            });

        for (const reviewer of reviewers) {
          if (!reviewer.email) continue;
          await enqueueEmail({
            type:           "task-assigned",
            recipientEmail: reviewer.email,
            recipientName:  reviewer.name || undefined,
            data: {
              taskTitle:       `Révision requise : ${content.title}`,
              taskDescription: `Toutes les tâches de production sont terminées. Le contenu "${content.title}" est prêt pour révision interne.`,
              assigneeName:    reviewer.name || reviewer.email,
              deadline:        "Dès que possible",
              taskLink:        `${process.env.NEXTAUTH_URL}/approvals`,
            },
          });
        }

        await prisma.auditLog.create({
          data: {
            action:     "STATUS_CHANGED",
            entityType: "Content",
            entityId:   task.contentId,
            prevValue:  { status: "IN_PRODUCTION" },
            newValue:   { status: "INTERNAL_REVIEW", via: "auto-transition" },
            userId:     session.user.id,
            contentId:  task.contentId,
          },
        });
      }
    }

    revalidatePath(`/contents/${task.contentId}`);
    revalidatePath("/my-tasks");
    return { success: true };
  } catch (err) {
    console.error("[completeTask]", err);
    return { success: false, error: "Erreur lors de la mise à jour." };
  }
}
