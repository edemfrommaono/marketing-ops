"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApprovalStatus, ContentStatus } from "@prisma/client";

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

    revalidatePath("/approvals");
    revalidatePath(`/contents/${contentId}`);
  } catch (err) {
    throw err;
  }
  redirect("/approvals");
}
