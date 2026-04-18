import { prisma } from "@/lib/db";
import { ok, err, requireAuth, parseBody } from "@/lib/api";
import { Platform } from "@prisma/client";

// POST /api/v1/editorial/publish
export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return err("Unauthorized", 401);

  const body = await parseBody<{
    contentId: string;
    platform: Platform;
    externalId?: string;
    url?: string;
    publishedAt?: string;
  }>(req);

  if (!body) return err("Invalid JSON body");
  if (!body.contentId || !body.platform) {
    return err("contentId and platform are required");
  }

  const content = await prisma.content.findUnique({
    where: { id: body.contentId },
    include: { publication: true },
  });

  if (!content) return err("Content not found", 404);
  if (content.status !== "APPROVED" && content.status !== "SCHEDULED") {
    return err(`Content must be APPROVED or SCHEDULED to publish (current: ${content.status})`, 422);
  }
  if (content.publication) {
    return err("Content has already been published", 409);
  }

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });

  const [publication] = await prisma.$transaction([
    prisma.publication.create({
      data: {
        contentId: body.contentId,
        platform: body.platform,
        externalId: body.externalId,
        url: body.url,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
        publishedById: dbUser?.id,
      },
    }),
    prisma.content.update({
      where: { id: body.contentId },
      data: { status: "PUBLISHED" },
    }),
    // Initialize performance record
    prisma.performance.create({
      data: { contentId: body.contentId },
    }),
  ]);

  // Audit log
  if (dbUser) {
    await prisma.auditLog.create({
      data: {
        action: "CONTENT_PUBLISHED",
        entityType: "Publication",
        entityId: publication.id,
        newValue: { platform: body.platform, url: body.url },
        userId: dbUser.id,
        contentId: body.contentId,
      },
    });
  }

  return ok(publication, 201);
}
