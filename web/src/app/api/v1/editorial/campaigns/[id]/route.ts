import { prisma } from "@/lib/db";
import { ok, err, requireAuth, parseBody } from "@/lib/api";
import { CampaignStatus, Platform } from "@prisma/client";

// GET /api/v1/editorial/campaigns/:id
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  if (!user) return err("Unauthorized", 401);

  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      createdBy: { select: { id: true, name: true, image: true, role: true } },
      calendarEntries: {
        orderBy: { publicationDate: "asc" },
        include: {
          contents: {
            include: {
              _count: { select: { assets: true, tasks: true } },
            },
          },
        },
      },
      risks: { orderBy: { createdAt: "desc" } },
      _count: { select: { calendarEntries: true, risks: true } },
    },
  });

  if (!campaign) return err("Campaign not found", 404);
  return ok(campaign);
}

// PATCH /api/v1/editorial/campaigns/:id
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  if (!user) return err("Unauthorized", 401);

  const body = await parseBody<{
    name?: string;
    objective?: string;
    status?: CampaignStatus;
    startDate?: string;
    endDate?: string;
    platforms?: Platform[];
    kpiTargets?: Record<string, number>;
  }>(req);

  if (!body) return err("Invalid JSON body");

  const existing = await prisma.campaign.findUnique({ where: { id: params.id } });
  if (!existing) return err("Campaign not found", 404);

  const campaign = await prisma.campaign.update({
    where: { id: params.id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.objective && { objective: body.objective }),
      ...(body.status && { status: body.status }),
      ...(body.startDate && { startDate: new Date(body.startDate) }),
      ...(body.endDate && { endDate: new Date(body.endDate) }),
      ...(body.platforms && { platforms: body.platforms }),
      ...(body.kpiTargets !== undefined && { kpiTargets: body.kpiTargets }),
    },
    include: {
      client: { select: { id: true, name: true, company: true } },
    },
  });

  return ok(campaign);
}

// DELETE /api/v1/editorial/campaigns/:id
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  if (!user) return err("Unauthorized", 401);

  const existing = await prisma.campaign.findUnique({ where: { id: params.id } });
  if (!existing) return err("Campaign not found", 404);

  // Soft-delete via status
  const campaign = await prisma.campaign.update({
    where: { id: params.id },
    data: { status: "ARCHIVED" },
  });

  return ok(campaign);
}
