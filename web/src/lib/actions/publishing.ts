"use server";

import { apiClient } from "@/lib/api-client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function publishContent(contentId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const response = await apiClient.post(`/editorial/publishing/${contentId}/publish`, {});

  if (response.error) {
    throw new Error(response.error);
  }

  revalidatePath("/publishing");
  revalidatePath(`/contents/${contentId}`);
  redirect("/publishing");
}

export async function scheduleContent(contentId: string, scheduledDate: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const response = await apiClient.post(`/editorial/publishing/${contentId}/schedule`, { scheduledDate });

  if (response.error) {
    throw new Error(response.error);
  }

  revalidatePath("/publishing");
  revalidatePath(`/contents/${contentId}`);
  redirect("/publishing");
}
