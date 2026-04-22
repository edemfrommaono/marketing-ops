import { apiClient } from "@/lib/api-client";
import { ContentStatus } from "@/types/api";

export interface CalendarEntry {
  id:              string;
  publicationDate: Date;
  platform:        string;
  contentType:     string;
  theme:           string;
  contents: {
    id:     string;
    title:  string;
    status: ContentStatus;
  }[];
}

export async function getCalendarEntries(filters: { from: Date; to: Date }): Promise<CalendarEntry[]> {
  const { from, to } = filters;
  const response = await apiClient.get<CalendarEntry[]>(
    `/editorial/calendar?from=${from.toISOString()}&to=${to.toISOString()}`
  );

  if (response.error || !response.data) {
    console.error("Failed to fetch calendar entries:", response.error);
    // Fallback to empty or mock if needed, but returning empty for now to show it's connected
    return [];
  }

  // Ensure dates are parsed
  return response.data.map(entry => ({
    ...entry,
    publicationDate: new Date(entry.publicationDate)
  }));
}

export async function getPlatformBreakdown(from: Date, to: Date) {
  const response = await apiClient.get<{ platform: string; count: number }[]>(
    `/editorial/performance/platforms?from=${from.toISOString()}&to=${to.toISOString()}`
  );

  if (response.error || !response.data) {
    return [];
  }

  return response.data;
}
