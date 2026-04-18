import { prisma } from "@/lib/db";
import { ok, err, requireAuth, parseBody, paginate } from "@/lib/api";
import { CampaignStatus, Platform } from "@prisma/client";

// GET /api/v1/editorial/campaigns
export async function GET(req: Request) {
  const user = await requireAuth();
  if (!user) return err("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const { skip, take, page, limit } = paginate(searchParams);

  const where = {
    ...(searchParams.get("status") && { status: searchParams.get("status") as CampaignStatus }),
    ...(searchParams.get("clientId") && { clientId: searchParams.get("clientId")! }),
  };

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true, company: true, logoUrl: true } },
        createdBy: { select: { id: true, name: true, image: true } },
        _count: { select: { calendarEntries: true, risks: true } },
      },
    }),
    prisma.campaign.count({ where }),
  ]);

  return ok({ data: campaigns, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
}

// POST /api/v1/editorial/campaigns
export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return err("Unauthorized", 401);

  const body = await parseBody<{
    name: string;
    objective: string;
    clientId: string;
    startDate: string;
    endDate: string;
    platforms?: Platform[];
    kpiTargets?: Record<string, number>;
  }>(req);

  if (!body) return err("Invalid JSON body");
  if (!body.name || !body.objective || !body.clientId || !body.startDate || !body.endDate) {
    return err("Missing required fields: name, objective, clientId, startDate, endDate");
  }

  const client = await prisma.client.findUnique({ where: { id: body.clientId } });
  if (!client) return err("Client not found", 404);

  // Find internal user record by email
  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser) return err("User not found", 404);

  const campaign = await prisma.campaign.create({
    data: {
      name: body.name,
      objective: body.objective,
      clientId: body.clientId,
      createdById: dbUser.id,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      platforms: body.platforms ?? [],
      kpiTargets: body.kpiTargets,
    },
    include: {
      client: { select: { id: true, name: true, company: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  return ok(campaign, 201);
}
