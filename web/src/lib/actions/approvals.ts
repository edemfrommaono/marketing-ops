"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApprovalStatus, ContentStatus } from "@prisma/client";
import { enqueueEmail } from "@/lib/queue/enqueue";

export async function approveContent(contentId: string, comment: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  try {
    // Upsert approval record
    const existing = await prisma.approval.findFirst({ where: { contentId } });
    if (existing) {
      await prisma.approval.update({
        where: { id: existing.id },
        data: {
          internalStatus: ApprovalStatus.APPROVED,
          internalNote:   comment || null,
          reviewedById:   session.user.id,
          reviewedAt:     new Date(),
        },
      });
    } else {
      await prisma.approval.create({
        data: {
          contentId,
          internalStatus: ApprovalStatus.APPROVED,
          internalNote:   comment || null,
          reviewedById:   session.user.id,
          reviewedAt:     new Date(),
        },
      });
    }

    // Advance content status to APPROVED
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: {
        calendarEntry: {
          include: { campaign: true },
        },
      },
    });

    await prisma.content.update({
      where: { id: contentId },
      data:  { status: ContentStatus.APPROVED },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action:     "APPROVED",
        entityType: "Content",
        entityId:   contentId,
        userId:     session.user.id,
        contentId,
        newValue:   { status: ContentStatus.APPROVED, comment },
      },
    });

    // Send approval notification email
    if (content) {
      const reviewer = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      // Notify content creator (through assigned tasks)
      const tasks = await prisma.productionTask.findMany({
        where: { contentId },
        include: { assignedTo: true },
      });

      for (const task of tasks) {
        if (task.assignedTo?.email) {
          await enqueueEmail({
            type: "content-approved",
            recipientEmail: task.assignedTo.email,
            recipientName: task.assignedTo.name || undefined,
            data: {
              contentTitle: content.title,
              approverName: reviewer?.name || reviewer?.email || "Admin",
              contentLink: `${process.env.NEXTAUTH_URL}/contents/${contentId}`,
              nextStep: "publication",
            },
          });
        }
      }
    }

    revalidatePath("/approvals");
    revalidatePath(`/approvals/${contentId}`);
    revalidatePath(`/contents/${contentId}`);
  } catch (err) {
    throw err;
  }
  redirect("/approvals");
}

export async function requestRevision(contentId: string, comment: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  try {
    const existing = await prisma.approval.findFirst({ where: { contentId } });
    if (existing) {
      await prisma.approval.update({
        where: { id: existing.id },
        data: {
          internalStatus: ApprovalStatus.REVISION_REQUIRED,
          internalNote:   comment || null,
          reviewedById:   session.user.id,
          reviewedAt:     new Date(),
        },
      });
    } else {
      await prisma.approval.create({
        data: {
          contentId,
          internalStatus: ApprovalStatus.REVISION_REQUIRED,
          internalNote:   comment || null,
          reviewedById:   session.user.id,
          reviewedAt:     new Date(),
        },
      });
    }

    const content = await prisma.content.findUnique({
      where: { id: contentId },
    });

    await prisma.content.update({
      where: { id: contentId },
      data:  { status: ContentStatus.REVISION_REQUIRED },
    });

    await prisma.auditLog.create({
      data: {
        action:     "REVISION_REQUESTED",
        entityType: "Content",
        entityId:   contentId,
        userId:     session.user.id,
        contentId,
        newValue:   { status: ContentStatus.REVISION_REQUIRED, comment },
      },
    });

    // Send revision required notification email
    if (content) {
      const reviewer = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      const tasks = await prisma.productionTask.findMany({
        where: { contentId },
        include: { assignedTo: true },
      });

      for (const task of tasks) {
        if (task.assignedTo?.email) {
          await enqueueEmail({
            type: "revision-required",
            recipientEmail: task.assignedTo.email,
            recipientName: task.assignedTo.name || undefined,
            data: {
              contentTitle: content.title,
              reviewerName: reviewer?.name || reviewer?.email || "Admin",
              comment: comment || "Veuillez vérifier les retours détaillés dans l'application",
              contentLink: `${process.env.NEXTAUTH_URL}/contents/${contentId}`,
            },
          });
        }
      }
    }

    revalidatePath("/approvals");
    revalidatePath(`/contents/${contentId}`);
  } catch (err) {
    throw err;
  }
  redirect("/approvals");
}

export async function rejectContent(contentId: string, comment: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  try {
    const existing = await prisma.approval.findFirst({ where: { contentId } });
    if (existing) {
      await prisma.approval.update({
        where: { id: existing.id },
        data: {
          internalStatus: ApprovalStatus.REJECTED,
          internalNote:   comment || null,
          reviewedById:   session.user.id,
          reviewedAt:     new Date(),
        },
      });
    } else {
      await prisma.approval.create({
        data: {
          contentId,
          internalStatus: ApprovalStatus.REJECTED,
          internalNote:   comment || null,
          reviewedById:   session.user.id,
          reviewedAt:     new Date(),
        },
      });
    }

    await prisma.content.update({
      where: { id: contentId },
      data:  { status: ContentStatus.ARCHIVED },
    });

    await prisma.auditLog.create({
      data: {
        action:     "REJECTED",
        entityType: "Content",
        entityId:   contentId,
        userId:     session.user.id,
        contentId,
        newValue:   { status: "ARCHIVED", comment },
      },
    });

    // Notify assignees that their content has been rejected
    const rejectedContent = await prisma.content.findUnique({
      where: { id: contentId },
      select: { title: true },
    });

    if (rejectedContent) {
      const reviewer = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true },
      });

      const tasks = await prisma.productionTask.findMany({
        where: { contentId },
        include: { assignedTo: true },
      });

      for (const task of tasks) {
        if (task.assignedTo?.email) {
          await enqueueEmail({
            type: "content-rejected",
            recipientEmail: task.assignedTo.email,
            recipientName: task.assignedTo.name || undefined,
            data: {
              contentTitle: rejectedContent.title,
              reviewerName: reviewer?.name || reviewer?.email || "Admin",
              comment: comment || "Aucun commentaire fourni.",
              contentLink: `${process.env.NEXTAUTH_URL}/contents/${contentId}`,
            },
          });
        }
      }
    }

    revalidatePath("/approvals");
    revalidatePath(`/contents/${contentId}`);
  } catch (err) {
    throw err;
  }
  redirect("/approvals");
}

// ─── Approval comment thread ──────────────────────────────────────────────────

export async function addApprovalComment(
  approvalId: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Non authentifié." };

  if (!body.trim()) return { success: false, error: "Le commentaire est vide." };

  try {
    await prisma.approvalComment.create({
      data: {
        approvalId,
        authorId: session.user.id,
        body:     body.trim(),
      },
    });

    const approval = await prisma.approval.findUnique({
      where:  { id: approvalId },
      select: { contentId: true },
    });
    if (approval) {
      revalidatePath(`/approvals/${approval.contentId}`);
    }
    return { success: true };
  } catch (err) {
    console.error("[addApprovalComment]", err);
    return { success: false, error: "Erreur lors de l'ajout du commentaire." };
  }
}
