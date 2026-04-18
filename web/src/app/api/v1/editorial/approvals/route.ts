import { prisma } from "@/lib/db";
import { ok, err, requireAuth, parseBody } from "@/lib/api";
import { ApprovalStatus } from "@prisma/client";

// POST /api/v1/editorial/approvals
// Submit or update internal/client approval for a content item
export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return err("Unauthorized", 401);

  const body = await parseBody<{
    contentId: string;
    internalStatus?: ApprovalStatus;
    clientStatus?: ApprovalStatus;
    internalNote?: string;
    clientNote?: string;
  }>(req);

  if (!body) return err("Invalid JSON body");
  if (!body.contentId) return err("contentId is required");
  if (!body.internalStatus && !body.clientStatus) {
    return err("At least one of internalStatus or clientStatus is required");
  }

  const content = await prisma.content.findUnique({ where: { id: body.contentId } });
  if (!content) return err("Content not found", 404);

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });

  // Upsert approval (one active approval per content)
  const approval = await prisma.approval.upsert({
    where: { id: (await prisma.approval.findFirst({ where: { contentId: body.contentId } }))?.id ?? "" },
    create: {
      contentId: body.contentId,
      internalStatus: body.internalStatus ?? "PENDING",
      clientStatus: body.clientStatus ?? "PENDING",
      internalNote: body.internalNote,
      clientNote: body.clientNote,
      reviewedById: dbUser?.id,
      reviewedAt: new Date(),
    },
    update: {
      ...(body.internalStatus && { internalStatus: body.internalStatus }),
      ...(body.clientStatus && { clientStatus: body.clientStatus }),
      ...(body.internalNote !== undefined && { internalNote: body.internalNote }),
      ...(body.clientNote !== undefined && { clientNote: body.clientNote }),
      reviewedById: dbUser?.id,
      reviewedAt: new Date(),
    },
  });

  // Auto-advance content status based on approval
  const bothApproved =
    approval.internalStatus === "APPROVED" && approval.clientStatus === "APPROVED";
  const anyRejected =
    approval.internalStatus === "REJECTED" ||
    approval.clientStatus === "REJECTED" ||
    approval.internalStatus === "REVISION_REQUIRED" ||
    approval.clientStatus === "REVISION_REQUIRED";

  if (bothApproved && content.status === "CLIENT_REVIEW") {
    await prisma.content.update({ where: { id: body.contentId }, data: { status: "APPROVED" } });
  } else if (anyRejected) {
    await prisma.content.update({ where: { id: body.contentId }, data: { status: "REVISION_REQUIRED" } });
  }

  // Create notification for content owner
  if (dbUser) {
    await prisma.auditLog.create({
      data: {
        action: "APPROVAL_UPDATED",
        entityType: "Approval",
        entityId: approval.id,
        newValue: { internalStatus: approval.internalStatus, clientStatus: approval.clientStatus },
        userId: dbUser.id,
        contentId: body.contentId,
      },
    });
  }

  return ok(approval, 201);
}
