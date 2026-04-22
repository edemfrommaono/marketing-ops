"use server";

import { apiClient } from "@/lib/api-client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCalendarEntry(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const campaignId    = formData.get("campaignId")    as string;
  const platform      = formData.get("platform")      as string;
  const contentType   = formData.get("contentType")   as string;
  const theme         = formData.get("theme")         as string;
  const notes         = formData.get("notes")         as string | null;
  const dateStr       = formData.get("publicationDate") as string;

  if (!campaignId || !platform || !contentType || !theme || !dateStr) {
    redirect("/calendar/new?error=missing_fields");
  }

  const response = await apiClient.post("/editorial/calendar", {
    campaignId,
    platform,
    contentType,
    theme: theme.trim(),
    notes: notes?.trim() || null,
    publicationDate: new Date(dateStr).toISOString(),
  });

  if (response.error) {
    console.error("[createCalendarEntry]", response.error);
    redirect("/calendar/new?error=api_error");
  }

  revalidatePath("/calendar");
  redirect("/calendar");
}
