/**
 * POST /api/cron/auto-publish
 *
 * Cron job to automatically publish scheduled content when the deadline has passed.
 * Finds all content with status=SCHEDULED and deadline <= now, creates a Publication
 * record, and updates status to PUBLISHED.
 *
 * Requires CRON_SECRET environment variable for authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ContentStatus } from "@prisma/client";
import { enqueueEmail } from "@/lib/queue/enqueue";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[auto-publish-cron] ⏰ Starting auto-publish job...");

    const now = new Date();

    // Find all SCHEDULED content whose deadline has passed
    const dueContent = await prisma.content.findMany({
      where: {
        status: ContentStatus.SCHEDULED,
        deadline: { lte: now },
      },
      include: {
        calendarEntry: { select: { platform: true } },
        tasks: { include: { assignedTo: { select: { id: true, email: true, name: true } } } },
      },
    });

    console.log(`[auto-publish-cron] Found ${dueContent.length} content item(s) to publish`);

    let published = 0;

    for (const content of dueContent) {
      try {
        // Upsert publication record
        await prisma.publication.upsert({
          where: { contentId: content.id },
          create: {
            contentId:   content.id,
            platform:    content.calendarEntry.platform,
            publishedAt: now,
          },
          update: {
            publishedAt: now,
          },
        });

        // Mark content as published
        await prisma.content.update({
          where: { id: content.id },
          data:  { status: ContentStatus.PUBLISHED },
        });

        // Audit log (no userId for cron-initiated action)
        await prisma.auditLog.create({
          data: {
            action:     "PUBLISHED",
            entityType: "Content",
            entityId:   content.id,
            contentId:  content.id,
            newValue:   { status: ContentStatus.PUBLISHED, via: "cron" },
          },
        });

        // Notify assignees
        for (const task of content.tasks) {
          if (task.assignedTo?.email) {
            await enqueueEmail({
              type:           "content-approved",
              recipientEmail: task.assignedTo.email,
              recipientName:  task.assignedTo.name || undefined,
              data: {
                contentTitle: content.title,
                approverName: "Publication automatique",
                contentLink:  `${process.env.NEXTAUTH_URL}/contents/${content.id}`,
                nextStep:     "Le contenu a été publié automatiquement selon le calendrier 🎉",
              },
            });
          }
        }

        published++;
        console.log(`[auto-publish-cron] ✅ Published: ${content.title} (${content.id})`);
      } catch (itemErr) {
        console.error(`[auto-publish-cron] ❌ Failed for content ${content.id}:`, itemErr);
      }
    }

    return NextResponse.json(
      {
        success:    true,
        published,
        total:      dueContent.length,
        timestamp:  now.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[auto-publish-cron] ❌ Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:   "Failed to run auto-publish job",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/** GET endpoint for manual testing */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return POST(req);
}
