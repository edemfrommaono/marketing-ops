"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Platform, ContentType } from "@prisma/client";

export async function createCalendarEntry(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const campaignId    = formData.get("campaignId")    as string;
  const platform      = formData.get("platform")      as Platform;
  const contentType   = formData.get("contentType")   as ContentType;
  const theme         = formData.get("theme")         as string;
  const notes         = formData.get("notes")         as string | null;
  const dateStr       = formData.get("publicationDate") as string;

  if (!campaignId || !platform || !contentType || !theme || !dateStr) {
    redirect("/calendar/new?error=missing_fields");
  }

  try {
    await prisma.calendarEntry.create({
      data: {
        publicationDate: new Date(dateStr),
        platform,
        contentType,
        theme:      theme.trim(),
        notes:      notes?.trim() || null,
        campaignId,
      },
    });
  } catch (err) {
    console.error("[createCalendarEntry]", err);
    redirect("/calendar/new?error=db_error");
  }

  revalidatePath("/calendar");
  redirect("/calendar");
}
