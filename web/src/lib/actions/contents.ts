"use server";

import { apiClient } from "@/lib/api-client";
import { revalidatePath } from "next/cache";

export async function createContent(formData: FormData) {
  const title = formData.get("title") as string;
  const response = await apiClient.post("/editorial/contents", { title });

  if (response.error) {
    return { success: false, error: response.error };
  }

  revalidatePath("/contents");
  return { success: true, content: response.data };
}

export async function updateContentStatus(id: string, status: string) {
  const response = await apiClient.patch(`/editorial/contents/${id}/status`, { status });

  if (response.error) {
    return { success: false, error: response.error };
  }

  revalidatePath("/contents");
  return { success: true };
}
