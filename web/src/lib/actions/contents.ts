"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ContentStatus, ContentFormat, ProductionTeam, Platform, ContentType } from "@prisma/client";

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

    revalidatePath("/contents");
    redirect(`/contents/${content.id}`);
  } catch (err) {
    throw err;
  }
}
