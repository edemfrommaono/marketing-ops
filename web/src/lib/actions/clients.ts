"use server";

import { apiClient } from "@/lib/api-client";
import { revalidatePath } from "next/cache";

export async function createClient(formData: FormData) {
  const name = formData.get("name") as string;
  const response = await apiClient.post("/editorial/clients", { name });

  if (response.error) {
    return { success: false, error: response.error };
  }

  revalidatePath("/admin/clients");
  return { success: true, client: response.data };
}
