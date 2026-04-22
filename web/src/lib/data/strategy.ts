import { apiClient } from "@/lib/api-client";
import { ContentStatus } from "@/types/api";

export interface StrategyKpis {
  totalClients:      number;
  activeCampaigns:   number;
  totalContents:     number;
  publishedContents: number;
}

export interface KanbanContent {
  id:     string;
  title:  string;
  status: ContentStatus;
  format: string;
  team:   string;
  deadline: string | null;
}

export interface KanbanColumns {
  backlog:      KanbanContent[];
  production:   KanbanContent[];
  distribution: KanbanContent[];
  live:         KanbanContent[];
}

export interface UpcomingEntry {
  id:              string;
  theme:           string;
  publicationDate: string;
  platform:        string;
  campaignName:    string;
}

export async function getStrategyKpis(): Promise<StrategyKpis> {
  const response = await apiClient.get<StrategyKpis>("/editorial/strategy/kpis");

  if (response.error || !response.data) {
    return {
      totalClients: 0,
      activeCampaigns: 0,
      totalContents: 0,
      publishedContents: 0,
    };
  }

  return response.data;
}

export async function getKanbanColumns(): Promise<KanbanColumns> {
  const response = await apiClient.get<KanbanColumns>("/editorial/strategy/kanban");

  if (response.error || !response.data) {
    return {
      backlog: [],
      production: [],
      distribution: [],
      live: [],
    };
  }

  return response.data;
}

export async function getUpcomingEntries(limit = 3): Promise<UpcomingEntry[]> {
  const response = await apiClient.get<UpcomingEntry[]>(`/editorial/strategy/upcoming?limit=${limit}`);

  if (response.error || !response.data) {
    return [];
  }

  return response.data;
}
