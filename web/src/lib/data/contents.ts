import { apiClient } from "@/lib/api-client";
import { ContentStatus } from "@/types/api";

export async function getContents(filters: any = {}) {
  const { page = 1, limit = 50 } = filters;
  const response = await apiClient.get<any>(`/editorial/contents?page=${page}&limit=${limit}`);

  if (response.error || !response.data) {
    return { contents: [], total: 0, page, limit };
  }

  return response.data;
}

export async function getContentById(id: string) {
  const response = await apiClient.get<any>(`/editorial/contents/${id}`);

  if (response.error || !response.data) {
    return null;
  }

  return response.data;
}

export async function getApprovalsQueue() {
  const response = await apiClient.get<any>("/editorial/approvals/queue");
  
  if (response.error || !response.data) {
    return { contents: [], total: 0, page: 1, limit: 50 };
  }

  return response.data;
}

export async function getPublishingQueue() {
  const response = await apiClient.get<any>("/editorial/publishing/queue");

  if (response.error || !response.data) {
    return { contents: [], total: 0, page: 1, limit: 50 };
  }

  return response.data;
}
