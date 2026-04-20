/**
 * POST /api/cron/deadline-reminders
 *
 * Daily cron job to send deadline reminder emails.
 * Checks for content with deadlines in 7, 3, 1, and 0 days.
 *
 * Requires CRON_SECRET environment variable for authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enqueueEmail } from "@/lib/queue/enqueue";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[deadline-cron] ⏰ Starting deadline reminder job...");

    const reminders = {
      j7: 0,
      j3: 0,
      j1: 0,
      j0: 0,
    };

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Helper function to find content with deadline on specific day offset
    const processDeadlineDay = async (
      daysOffset: number,
      dayLabel: "j7" | "j3" | "j1" | "j0"
    ) => {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysOffset);

      // Query content with deadline on this date
      const content = await prisma.content.findMany({
        where: {
          AND: [
            {
              deadline: {
                gte: new Date(targetDate.setHours(0, 0, 0, 0)),
              },
            },
            {
              deadline: {
                lte: new Date(targetDate.setHours(23, 59, 59, 999)),
              },
            },
            {
              // Only notify for content that's not already archived or completed
              status: {
                notIn: ["ARCHIVED", "PUBLISHED"],
              },
            },
          ],
        },
        include: {
          tasks: {
            include: {
              assignedTo: true,
            },
          },
        },
      });

      // Send reminder emails to all assignees
      for (const item of content) {
        const uniqueEmails = new Set<string>();

        // Collect all unique assignee emails
        for (const task of item.tasks) {
          if (task.assignedTo?.email) {
            uniqueEmails.add(task.assignedTo.email);
          }
        }

        // Send email to each assignee
        for (const email of Array.from(uniqueEmails)) {
          await enqueueEmail({
            type: "deadline-reminder",
            recipientEmail: email,
            data: {
              contentTitle: item.title,
              daysRemaining: daysOffset,
              contentLink: `${process.env.NEXTAUTH_URL}/contents/${item.id}`,
              subject:
                daysOffset === 0
                  ? `⚠️ Deadline AUJOURD'HUI: ${item.title}`
                  : `Rappel: ${daysOffset}j avant deadline pour ${item.title}`,
            },
          });

          reminders[dayLabel]++;
        }
      }
    };

    // Process each deadline day
    await processDeadlineDay(7, "j7");
    await processDeadlineDay(3, "j3");
    await processDeadlineDay(1, "j1");
    await processDeadlineDay(0, "j0");

    const totalReminders =
      reminders.j7 + reminders.j3 + reminders.j1 + reminders.j0;

    console.log(
      `[deadline-cron] ✅ Sent ${totalReminders} deadline reminders:`,
      reminders
    );

    return NextResponse.json(
      {
        success: true,
        message: "Deadline reminders processed successfully",
        reminders,
        totalReminders,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[deadline-cron] ❌ Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process deadline reminders",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for testing (if no cron service is available)
 */
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return POST(req);
}
