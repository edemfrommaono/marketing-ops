import { prisma } from "@/lib/db";
import { ok, err, requireAuth, parseBody, paginate } from "@/lib/api";

// GET /api/v1/editorial/performance
export async function GET(req: Request) {
  const user = await requireAuth();
  if (!user) return err("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const { skip, take, page, limit } = paginate(searchParams);
  const campaignId = searchParams.get("campaignId");

  const where = campaignId
    ? {
        content: {
          calendarEntry: { campaignId },
        },
      }
    : {};

  const [records, total] = await Promise.all([
    prisma.performance.findMany({
      where,
      skip,
      take,
      orderBy: { collectedAt: "desc" },
      include: {
        content: {
          select: {
            id: true,
            title: true,
            calendarEntry: {
              select: {
                platform: true,
                publicationDate: true,
                campaign: { select: { id: true, name: true } },
              },
            },
          },
        },
        publication: { select: { platform: true, publishedAt: true, url: true } },
      },
    }),
    prisma.performance.count({ where }),
  ]);

  // Aggregate totals for dashboard KPIs
  const aggregates = await prisma.performance.aggregate({
    where,
    _sum: { impressions: true, reach: true, engagement: true, clicks: true, conversions: true },
    _avg: { ctr: true },
  });

  return ok({
    data: records,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
    aggregates: aggregates._sum,
    avgCtr: aggregates._avg.ctr,
  });
}

// PATCH /api/v1/editorial/performance — update metrics (e.g. from Odoo sync)
export async function PATCH(req: Request) {
  const user = await requireAuth();
  if (!user) return err("Unauthorized", 401);

  const body = await parseBody<{
    contentId: string;
    impressions?: number;
    reach?: number;
    engagement?: number;
    clicks?: number;
    conversions?: number;
    ctr?: number;
  }>(req);

  if (!body) return err("Invalid JSON body");
  if (!body.contentId) return err("contentId is required");

  const performance = await prisma.performance.upsert({
    where: { contentId: body.contentId },
    create: {
      contentId: body.contentId,
      impressions: body.impressions ?? 0,
      reach: body.reach ?? 0,
      engagement: body.engagement ?? 0,
      clicks: body.clicks ?? 0,
      conversions: body.conversions ?? 0,
      ctr: body.ctr,
    },
    update: {
      ...(body.impressions !== undefined && { impressions: body.impressions }),
      ...(body.reach !== undefined && { reach: body.reach }),
      ...(body.engagement !== undefined && { engagement: body.engagement }),
      ...(body.clicks !== undefined && { clicks: body.clicks }),
      ...(body.conversions !== undefined && { conversions: body.conversions }),
      ...(body.ctr !== undefined && { ctr: body.ctr }),
      collectedAt: new Date(),
    },
  });

  return ok(performance);
}
