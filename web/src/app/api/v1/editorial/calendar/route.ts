import { prisma } from "@/lib/db";
import { ok, err, requireAuth, parseBody, paginate } from "@/lib/api";
import { Platform, ContentType } from "@prisma/client";

// GET /api/v1/editorial/calendar
export async function GET(req: Request) {
  const user = await requireAuth();
  if (!user) return err("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const { skip, take, page, limit } = paginate(searchParams);

  const campaignId = searchParams.get("campaignId");
  const platform = searchParams.get("platform") as Platform | null;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where = {
    ...(campaignId && { campaignId }),
    ...(platform && { platform }),
    ...(from || to
      ? {
          publicationDate: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }
      : {}),
  };

  const [entries, total] = await Promise.all([
    prisma.calendarEntry.findMany({
      where,
      skip,
      take,
      orderBy: { publicationDate: "asc" },
      include: {
        campaign: { select: { id: true, name: true, client: { select: { name: true } } } },
        contents: {
          select: { id: true, title: true, status: true, assignedTeam: true, deadline: true },
        },
      },
    }),
    prisma.calendarEntry.count({ where }),
  ]);

  return ok({ data: entries, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
}

// POST /api/v1/editorial/calendar
export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return err("Unauthorized", 401);

  const body = await parseBody<{
    campaignId: string;
    publicationDate: string;
    platform: Platform;
    contentType: ContentType;
    theme: string;
    notes?: string;
  }>(req);

  if (!body) return err("Invalid JSON body");
  if (!body.campaignId || !body.publicationDate || !body.platform || !body.contentType || !body.theme) {
    return err("Missing required fields: campaignId, publicationDate, platform, contentType, theme");
  }

  const campaign = await prisma.campaign.findUnique({ where: { id: body.campaignId } });
  if (!campaign) return err("Campaign not found", 404);

  const entry = await prisma.calendarEntry.create({
    data: {
      campaignId: body.campaignId,
      publicationDate: new Date(body.publicationDate),
      platform: body.platform,
      contentType: body.contentType,
      theme: body.theme,
      notes: body.notes,
    },
    include: {
      campaign: { select: { id: true, name: true } },
    },
  });

  return ok(entry, 201);
}
