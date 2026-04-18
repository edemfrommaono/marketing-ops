import { prisma } from "@/lib/db";
import { ContentStatus, ProductionTeam, type Prisma } from "@prisma/client";

export type ContentRow = Prisma.ContentGetPayload<{
  include: {
    calendarEntry: {
      include: {
        campaign: { select: { id: true; name: true } };
      };
    };
    _count: { select: { assets: true; tasks: true } };
    approvals: { select: { internalStatus: true; clientStatus: true } };
  };
}>;

export interface ContentFilters {
  status?:    ContentStatus | ContentStatus[];
  team?:      ProductionTeam;
  campaignId?: string;
  urgent?:    boolean;
  search?:    string;
  page?:      number;
  limit?:     number;
}

export async function getContents(filters: ContentFilters = {}) {
  const { status, team, campaignId, search, page = 1, limit = 50 } = filters;

  try {
    const where: Prisma.ContentWhereInput = {
      ...(status && {
        status: Array.isArray(status) ? { in: status } : status,
      }),
      ...(team && { assignedTeam: team }),
      ...(campaignId && {
        calendarEntry: { campaignId },
      }),
      ...(search && {
        title: { contains: search, mode: "insensitive" },
      }),
      // Exclude archived by default
      NOT: { status: ContentStatus.ARCHIVED },
    };

    const [contents, total] = await Promise.all([
      prisma.content.findMany({
        where,
        include: {
          calendarEntry: {
            include: { campaign: { select: { id: true, name: true } } },
          },
          _count:    { select: { assets: true, tasks: true } },
          approvals: { select: { internalStatus: true, clientStatus: true } },
        },
        orderBy: { deadline: "asc" },
        take:    limit,
        skip:    (page - 1) * limit,
      }),
      prisma.content.count({ where }),
    ]);

    return { contents, total, page, limit };
  } catch {
    return { contents: [] as ContentRow[], total: 0, page, limit };
  }
}

export type ContentDetail = Prisma.ContentGetPayload<{
  include: {
    calendarEntry: {
      include: {
        campaign: { include: { client: true } };
      };
    };
    assets:    true;
    approvals: { include: { reviewedBy: { select: { name: true; email: true } } } };
    tasks:     { include: { assignedTo: { select: { name: true } } }; orderBy: { createdAt: "asc" } };
    auditLogs: { include: { user: { select: { name: true } } }; orderBy: { createdAt: "desc" }; take: 10 };
    reminders: true;
  };
}>;

export async function getContentById(id: string): Promise<ContentDetail | null> {
  try {
    return await prisma.content.findUnique({
      where: { id },
      include: {
        calendarEntry: {
          include: { campaign: { include: { client: true } } },
        },
        assets:    { orderBy: { createdAt: "desc" } },
        approvals: { include: { reviewedBy: { select: { name: true, email: true } } } },
        tasks: {
          include: { assignedTo: { select: { name: true } } },
          orderBy: { createdAt: "asc" },
        },
        auditLogs: {
          include: { user: { select: { name: true } } },
          orderBy:  { createdAt: "desc" },
          take:     10,
        },
        reminders: { orderBy: { scheduledAt: "asc" } },
      },
    });
  } catch {
    return null;
  }
}

/** Contents awaiting approval — INTERNAL_REVIEW or CLIENT_REVIEW */
export async function getApprovalsQueue() {
  return getContents({
    status: [ContentStatus.INTERNAL_REVIEW, ContentStatus.CLIENT_REVIEW],
    limit:  100,
  });
}

/** Contents ready to publish — APPROVED or SCHEDULED */
export async function getPublishingQueue() {
  return getContents({
    status: [ContentStatus.APPROVED, ContentStatus.SCHEDULED],
    limit:  100,
  });
}
