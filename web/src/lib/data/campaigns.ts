import { prisma } from "@/lib/db";
import { CampaignStatus, type Prisma } from "@prisma/client";

export type CampaignRow = Prisma.CampaignGetPayload<{
  include: {
    client: { select: { name: true; company: true } };
    _count: { select: { calendarEntries: true } };
    risks: { select: { level: true; isResolved: true } };
  };
}>;

export interface CampaignFilters {
  status?:   CampaignStatus;
  clientId?: string;
  search?:   string;
  page?:     number;
  limit?:    number;
}

export async function getCampaigns(filters: CampaignFilters = {}) {
  const { status, clientId, search, page = 1, limit = 25 } = filters;

  try {
    const where: Prisma.CampaignWhereInput = {
      ...(status   && { status }),
      ...(clientId && { clientId }),
      ...(search   && { name: { contains: search, mode: "insensitive" } }),
    };

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
          client: { select: { name: true, company: true } },
          _count: { select: { calendarEntries: true } },
          risks:  { select: { level: true, isResolved: true } },
        },
        orderBy: { createdAt: "desc" },
        take:    limit,
        skip:    (page - 1) * limit,
      }),
      prisma.campaign.count({ where }),
    ]);

    return { campaigns, total, page, limit };
  } catch {
    // DB unavailable — return empty set
    return { campaigns: [] as CampaignRow[], total: 0, page, limit };
  }
}

export type CampaignDetail = Prisma.CampaignGetPayload<{
  include: {
    client: true;
    calendarEntries: {
      include: {
        contents: {
          include: {
            _count: { select: { assets: true; tasks: true } };
            approvals: { select: { internalStatus: true; clientStatus: true } };
          };
        };
      };
    };
    risks: true;
  };
}>;

export async function getCampaignById(id: string): Promise<CampaignDetail | null> {
  try {
    return await prisma.campaign.findUnique({
      where: { id },
      include: {
        client: true,
        calendarEntries: {
          include: {
            contents: {
              include: {
                _count: { select: { assets: true, tasks: true } },
                approvals: { select: { internalStatus: true, clientStatus: true } },
              },
            },
          },
          orderBy: { publicationDate: "asc" },
        },
        risks: { orderBy: [{ level: "desc" }, { createdAt: "desc" }] },
      },
    });
  } catch {
    return null;
  }
}
