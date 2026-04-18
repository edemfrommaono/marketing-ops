import { prisma } from "@/lib/db";
import { ok, err, requireAuth, parseBody } from "@/lib/api";
import { ContentStatus, ContentFormat, ProductionTeam } from "@prisma/client";

// Allowed status transitions
const TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  DRAFT: ["IN_PRODUCTION"],
  IN_PRODUCTION: ["INTERNAL_REVIEW"],
  INTERNAL_REVIEW: ["CLIENT_REVIEW", "REVISION_REQUIRED"],
  CLIENT_REVIEW: ["APPROVED", "REVISION_REQUIRED"],
  REVISION_REQUIRED: ["IN_PRODUCTION"],
  APPROVED: ["SCHEDULED"],
  SCHEDULED: ["PUBLISHED"],
  PUBLISHED: ["ARCHIVED"],
  ARCHIVED: [],
};

// GET /api/v1/editorial/contents/:id
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  if (!user) return err("Unauthorized", 401);

  const content = await prisma.content.findUnique({
    where: { id: params.id },
    include: {
      calendarEntry: {
        include: { campaign: { include: { client: true } } },
      },
      assets: { orderBy: [{ isActive: "desc" }, { createdAt: "desc" }] },
      approvals: { orderBy: { createdAt: "desc" } },
      variants: { include: { assets: true } },
      tasks: {
        include: {
          assignedTo: { select: { id: true, name: true, image: true, role: true } },
          dependsOn: { select: { id: true, title: true, status: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      publication: true,
      performance: true,
      reminders: { orderBy: { scheduledAt: "asc" } },
    },
  });

  if (!content) return err("Content not found", 404);
  return ok(content);
}

// PATCH /api/v1/editorial/contents/:id
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  if (!user) return err("Unauthorized", 401);

  const body = await parseBody<{
    title?: string;
    format?: ContentFormat;
    assignedTeam?: ProductionTeam;
    deadline?: string;
    status?: ContentStatus;
    briefUrl?: string;
    briefNotes?: string;
  }>(req);

  if (!body) return err("Invalid JSON body");

  const existing = await prisma.content.findUnique({ where: { id: params.id } });
  if (!existing) return err("Content not found", 404);

  // Validate status transition
  if (body.status && body.status !== existing.status) {
    const allowed = TRANSITIONS[existing.status];
    if (!allowed.includes(body.status)) {
      return err(
        `Invalid status transition: ${existing.status} → ${body.status}. Allowed: ${allowed.join(", ") || "none"}`,
        422
      );
    }
  }

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });

  const content = await prisma.content.update({
    where: { id: params.id },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.format && { format: body.format }),
      ...(body.assignedTeam && { assignedTeam: body.assignedTeam }),
      ...(body.deadline && { deadline: new Date(body.deadline) }),
      ...(body.status && { status: body.status }),
      ...(body.briefUrl !== undefined && { briefUrl: body.briefUrl }),
      ...(body.briefNotes !== undefined && { briefNotes: body.briefNotes }),
    },
  });

  // Audit log
  if (dbUser) {
    await prisma.auditLog.create({
      data: {
        action: body.status ? "STATUS_CHANGED" : "CONTENT_UPDATED",
        entityType: "Content",
        entityId: params.id,
        prevValue: { status: existing.status },
        newValue: { status: content.status },
        userId: dbUser.id,
        contentId: params.id,
      },
    });
  }

  return ok(content);
}

// DELETE /api/v1/editorial/contents/:id
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  if (!user) return err("Unauthorized", 401);

  const existing = await prisma.content.findUnique({ where: { id: params.id } });
  if (!existing) return err("Content not found", 404);

  await prisma.content.update({ where: { id: params.id }, data: { status: "ARCHIVED" } });

  return ok({ message: "Content archived" });
}
