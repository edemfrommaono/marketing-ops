"use server";

import { apiClient } from "@/lib/api-client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function approveContent(contentId: string, comment: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const response = await apiClient.post(`/editorial/approvals/${contentId}/approve`, { comment });

  if (response.error) {
    throw new Error(response.error);
  }

  revalidatePath("/approvals");
  revalidatePath(`/approvals/${contentId}`);
  revalidatePath(`/contents/${contentId}`);
  redirect("/approvals");
}

export async function requestRevision(contentId: string, comment: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const response = await apiClient.post(`/editorial/approvals/${contentId}/revision`, { comment });

  if (response.error) {
    throw new Error(response.error);
  }

  revalidatePath("/approvals");
  revalidatePath(`/contents/${contentId}`);
  redirect("/approvals");
}

export async function rejectContent(contentId: string, comment: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const response = await apiClient.post(`/editorial/approvals/${contentId}/reject`, { comment });

  if (response.error) {
    throw new Error(response.error);
  }

  revalidatePath("/approvals");
  revalidatePath(`/contents/${contentId}`);
  redirect("/approvals");
}
