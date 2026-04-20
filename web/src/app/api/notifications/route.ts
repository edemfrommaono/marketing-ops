import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/** GET /api/notifications — returns latest 20 notifications for the current user */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notifications = await prisma.notification.findMany({
      where:   { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take:    20,
    });
    const unreadCount = notifications.filter(n => !n.isRead).length;
    return NextResponse.json({ notifications, unreadCount });
  } catch {
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}

/** PATCH /api/notifications — marks all as read (or specific ids) */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const ids: string[] | undefined = body.ids;

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        ...(ids?.length ? { id: { in: ids } } : { isRead: false }),
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
