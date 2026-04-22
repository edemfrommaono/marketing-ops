import { apiClient } from "@/lib/api-client";
import { CampaignStatus } from "@/types/api";

export async function getCampaigns(filters: any = {}) {
  const { page = 1, limit = 25 } = filters;
  const response = await apiClient.get<any>(`/editorial/campaigns?page=${page}&limit=${limit}`);

  if (response.error || !response.data) {
    return { campaigns: [], total: 0, page, limit };
  }

  return response.data;
}

export async function getCampaignById(id: string) {
  const response = await apiClient.get<any>(`/editorial/campaigns/${id}`);

  if (response.error || !response.data) {
    return null;
  }

  return response.data;
}
