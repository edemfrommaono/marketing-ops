import { apiClient } from "@/lib/api-client";

export async function getGlobalKpis() {
  const response = await apiClient.get<any>("/editorial/performance/kpis");
  
  if (response.error || !response.data) {
    return {
      totalReach: 0,
      totalEngagement: 0,
      totalClicks: 0,
      totalConversions: 0,
      avgCtr: 0,
      contentCount: 0,
    };
  }

  return response.data;
}

export async function getCampaignPerformance(campaignId: string) {
  const response = await apiClient.get<any>(`/editorial/performance/campaign/${campaignId}`);

  if (response.error || !response.data) {
    return {
      reach: 0,
      engagement: 0,
      clicks: 0,
      conversions: 0,
      count: 0,
    };
  }

  return response.data;
}

export async function getTopContent(limit = 10) {
  const response = await apiClient.get<any[]>(`/editorial/performance/top-content?limit=${limit}`);

  if (response.error || !response.data) {
    return [];
  }

  return response.data;
}
