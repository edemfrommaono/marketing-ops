import { apiClient } from "@/lib/api-client";

export async function getClients() {
  const response = await apiClient.get<any[]>("/editorial/clients");
  
  if (response.error || !response.data) {
    return [];
  }

  return response.data;
}

export async function getClientOptions() {
  const response = await apiClient.get<any[]>("/editorial/clients/options");
  
  if (response.error || !response.data) {
    return [];
  }

  return response.data;
}
