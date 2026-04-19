import { prisma } from "@/lib/db";
import { ContentStatus } from "@prisma/client";

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

// ── KPI aggregates ────────────────────────────────────────────────────────────

export async function getStrategyKpis(): Promise<StrategyKpis> {
  try {
    const [totalClients, activeCampaigns, totalContents, publishedContents] = await Promise.all([
      prisma.client.count(),
      prisma.campaign.count({ where: { status: { in: ["ACTIVE", "DRAFT"] } } }),
      prisma.content.count(),
      prisma.content.count({ where: { status: "PUBLISHED" } }),
    ]);
    return { totalClients, activeCampaigns, totalContents, publishedContents };
  } catch {
    return { totalClients: 0, activeCampaigns: 0, totalContents: 0, publishedContents: 0 };
  }
}

// ── Kanban content columns ────────────────────────────────────────────────────

const BACKLOG_STATUSES: ContentStatus[]      = ["DRAFT"];
const PRODUCTION_STATUSES: ContentStatus[]   = ["IN_PRODUCTION", "INTERNAL_REVIEW", "REVISION_REQUIRED"];
const DISTRIBUTION_STATUSES: ContentStatus[] = ["CLIENT_REVIEW", "APPROVED", "SCHEDULED"];
const LIVE_STATUSES: ContentStatus[]         = ["PUBLISHED", "ARCHIVED"];

function mapContent(c: {
  id: string;
  title: string;
  status: ContentStatus;
  format: string;
  assignedTeam: string;
  deadline: Date | null;
}): KanbanContent {
  return {
    id:       c.id,
    title:    c.title,
    status:   c.status,
    format:   c.format,
    team:     c.assignedTeam,
    deadline: c.deadline ? c.deadline.toISOString() : null,
  };
}

export async function getKanbanColumns(): Promise<KanbanColumns> {
  try {
    const allContents = await prisma.content.findMany({
      where: {
        status: {
          in: [
            ...BACKLOG_STATUSES,
            ...PRODUCTION_STATUSES,
            ...DISTRIBUTION_STATUSES,
            ...LIVE_STATUSES,
          ],
        },
      },
      select: {
        id:           true,
        title:        true,
        status:       true,
        format:       true,
        assignedTeam: true,
        deadline:     true,
      },
      orderBy: { createdAt: "desc" },
      take: 60, // reasonable cap for UI performance
    });

    const byStatus = (statuses: ContentStatus[]) =>
      allContents.filter(c => statuses.includes(c.status)).map(mapContent);

    return {
      backlog:      byStatus(BACKLOG_STATUSES),
      production:   byStatus(PRODUCTION_STATUSES),
      distribution: byStatus(DISTRIBUTION_STATUSES),
      live:         byStatus(LIVE_STATUSES),
    };
  } catch {
    return { backlog: [], production: [], distribution: [], live: [] };
  }
}

// ── Upcoming publications (for sidebar) ──────────────────────────────────────

export async function getUpcomingEntries(limit = 3): Promise<UpcomingEntry[]> {
  try {
    const now = new Date();
    const entries = await prisma.calendarEntry.findMany({
      where:   { publicationDate: { gte: now } },
      orderBy: { publicationDate: "asc" },
      take:    limit,
      select: {
        id:              true,
        theme:           true,
        publicationDate: true,
        platform:        true,
        campaign: { select: { name: true } },
      },
    });

    return entries.map(e => ({
      id:              e.id,
      theme:           e.theme,
      publicationDate: e.publicationDate.toISOString(),
      platform:        e.platform,
      campaignName:    e.campaign.name,
    }));
  } catch {
    return [];
  }
}
