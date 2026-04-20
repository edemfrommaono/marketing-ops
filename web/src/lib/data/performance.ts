import { prisma } from "@/lib/db";

export interface GlobalKpis {
  totalReach:       number;
  totalEngagement:  number;
  totalClicks:      number;
  totalConversions: number;
  avgCtr:           number | null;
  contentCount:     number;
}

export async function getGlobalKpis(from?: Date, to?: Date): Promise<GlobalKpis> {
  try {
    const where = from || to
      ? { collectedAt: { ...(from && { gte: from }), ...(to && { lte: to }) } }
      : undefined;

    const agg = await prisma.performance.aggregate({
      where,
      _sum: {
        reach:       true,
        engagement:  true,
        clicks:      true,
        conversions: true,
      },
      _avg: { ctr: true },
      _count: { id: true },
    });

    return {
      totalReach:       agg._sum.reach       ?? 0,
      totalEngagement:  agg._sum.engagement  ?? 0,
      totalClicks:      agg._sum.clicks      ?? 0,
      totalConversions: agg._sum.conversions ?? 0,
      avgCtr:           agg._avg.ctr         ?? null,
      contentCount:     agg._count.id,
    };
  } catch {
    return {
      totalReach: 0, totalEngagement: 0, totalClicks: 0,
      totalConversions: 0, avgCtr: null, contentCount: 0,
    };
  }
}

/** Per-campaign performance aggregation */
export async function getCampaignPerformance(campaignId: string) {
  try {
    const entries = await prisma.calendarEntry.findMany({
      where: { campaignId },
      select: { contents: { select: { performance: true } } },
    });

    const perfs = entries.flatMap(e => e.contents.flatMap(c => c.performance ?? []));

    return {
      reach:       perfs.reduce((s, p) => s + p.reach,       0),
      engagement:  perfs.reduce((s, p) => s + p.engagement,  0),
      clicks:      perfs.reduce((s, p) => s + p.clicks,       0),
      conversions: perfs.reduce((s, p) => s + p.conversions,  0),
      count:       perfs.length,
    };
  } catch {
    return { reach: 0, engagement: 0, clicks: 0, conversions: 0, count: 0 };
  }
}

/** Published content with performance, ordered by reach desc */
export async function getTopContent(limit = 10) {
  try {
    return await prisma.performance.findMany({
      orderBy: { reach: "desc" },
      take:    limit,
      include: {
        content: {
          include: {
            calendarEntry: {
              include: { campaign: { select: { name: true } } },
            },
          },
        },
        publication: { select: { platform: true, publishedAt: true, url: true } },
      },
    });
  } catch {
    return [];
  }
}
