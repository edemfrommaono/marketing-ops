"use server";

import { apiClient } from "@/lib/api-client";
import { revalidatePath } from "next/cache";

export async function createCampaign(formData: FormData) {
  const name = formData.get("name") as string;
  const response = await apiClient.post("/editorial/campaigns", { name });

  if (response.error) {
    return { success: false, error: response.error };
  }

  revalidatePath("/campaigns");
  return { success: true, campaign: response.data };
}

export async function updateCampaignStatus(id: string, status: string) {
  const response = await apiClient.patch(`/editorial/campaigns/${id}/status`, { status });

  if (response.error) {
    return { success: false, error: response.error };
  }

  revalidatePath("/campaigns");
  return { success: true };
}
