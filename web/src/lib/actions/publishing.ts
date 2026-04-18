"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ContentStatus } from "@prisma/client";

export async function publishContent(contentId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  try {
    const content = await prisma.content.findUnique({
      where:   { id: contentId },
      include: { calendarEntry: { select: { platform: true } } },
    });
    if (!content) throw new Error("Content not found");

    // Create publication record
    await prisma.publication.upsert({
      where:  { contentId },
      create: {
        contentId,
        platform:      content.calendarEntry.platform,
        publishedAt:   new Date(),
        publishedById: session.user.id,
      },
      update: {
        publishedAt:   new Date(),
        publishedById: session.user.id,
      },
    });

    // Mark content as published
    await prisma.content.update({
      where: { id: contentId },
      data:  { status: ContentStatus.PUBLISHED },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action:     "PUBLISHED",
        entityType: "Content",
        entityId:   contentId,
        userId:     session.user.id,
        contentId,
        newValue:   { status: ContentStatus.PUBLISHED },
      },
    });

    revalidatePath("/publishing");
    revalidatePath(`/contents/${contentId}`);
  } catch (err) {
    throw err;
  }
  redirect("/publishing");
}

export async function scheduleContent(contentId: string, scheduledDate: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  try {
    await prisma.content.update({
      where: { id: contentId },
      data:  {
        status:   ContentStatus.SCHEDULED,
        deadline: new Date(scheduledDate),
      },
    });

    revalidatePath("/publishing");
    revalidatePath(`/contents/${contentId}`);
  } catch (err) {
    throw err;
  }
  redirect("/publishing");
}
