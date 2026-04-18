import { prisma } from "@/lib/db";
import { Platform, type Prisma } from "@prisma/client";

export type CalendarEntryWithContent = Prisma.CalendarEntryGetPayload<{
  include: {
    campaign: { select: { id: true; name: true } };
    contents: { select: { id: true; status: true; title: true } };
  };
}>;

export interface CalendarFilters {
  from?:       Date;
  to?:         Date;
  platform?:   Platform;
  campaignId?: string;
}

export async function getCalendarEntries(filters: CalendarFilters = {}) {
  const {
    from = new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to   = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    platform,
    campaignId,
  } = filters;

  try {
    const where: Prisma.CalendarEntryWhereInput = {
      publicationDate: { gte: from, lte: to },
      ...(platform   && { platform }),
      ...(campaignId && { campaignId }),
    };

    const entries = await prisma.calendarEntry.findMany({
      where,
      include: {
        campaign: { select: { id: true, name: true } },
        contents: { select: { id: true, status: true, title: true } },
      },
      orderBy: { publicationDate: "asc" },
    });

    return entries;
  } catch {
    return [] as CalendarEntryWithContent[];
  }
}

/** Platform breakdown — count of entries per platform for the current month */
export async function getPlatformBreakdown(from?: Date, to?: Date) {
  const start = from ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end   = to   ?? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

  try {
    const rows = await prisma.calendarEntry.groupBy({
      by:    ["platform"],
      where: { publicationDate: { gte: start, lte: end } },
      _count: { platform: true },
    });
    return rows.map(r => ({ platform: r.platform, count: r._count.platform }));
  } catch {
    return [] as { platform: Platform; count: number }[];
  }
}
