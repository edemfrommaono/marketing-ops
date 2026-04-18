import { prisma } from "@/lib/db";
import { ok, err, requireAuth, parseBody, paginate } from "@/lib/api";
import { RiskLevel } from "@prisma/client";

// GET /api/v1/editorial/risks
export async function GET(req: Request) {
  const user = await requireAuth();
  if (!user) return err("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const { skip, take, page, limit } = paginate(searchParams);

  const where = {
    ...(searchParams.get("campaignId") && { campaignId: searchParams.get("campaignId")! }),
    ...(searchParams.get("level") && { level: searchParams.get("level") as RiskLevel }),
    isResolved: searchParams.get("resolved") === "true" ? true : false,
  };

  const [risks, total] = await Promise.all([
    prisma.risk.findMany({
      where,
      skip,
      take,
      orderBy: [{ level: "desc" }, { createdAt: "desc" }],
      include: {
        campaign: { select: { id: true, name: true } },
        reportedBy: { select: { id: true, name: true, image: true } },
      },
    }),
    prisma.risk.count({ where }),
  ]);

  return ok({ data: risks, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
}

// POST /api/v1/editorial/risks
export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return err("Unauthorized", 401);

  const body = await parseBody<{
    campaignId: string;
    title: string;
    description: string;
    level: RiskLevel;
    contentId?: string;
    mitigation?: string;
  }>(req);

  if (!body) return err("Invalid JSON body");
  if (!body.campaignId || !body.title || !body.description || !body.level) {
    return err("Missing required fields: campaignId, title, description, level");
  }

  const campaign = await prisma.campaign.findUnique({ where: { id: body.campaignId } });
  if (!campaign) return err("Campaign not found", 404);

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });

  const risk = await prisma.risk.create({
    data: {
      campaignId: body.campaignId,
      title: body.title,
      description: body.description,
      level: body.level,
      contentId: body.contentId,
      mitigation: body.mitigation,
      reportedById: dbUser?.id,
    },
    include: {
      campaign: { select: { id: true, name: true } },
      reportedBy: { select: { id: true, name: true } },
    },
  });

  return ok(risk, 201);
}
