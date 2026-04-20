import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ContentStatus, ProductionTeam } from "@prisma/client";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { ids?: string[]; action?: string; team?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { ids, action, team } = body;
  if (!ids?.length || !action) {
    return NextResponse.json({ error: "ids and action are required" }, { status: 400 });
  }

  try {
    if (action === "archive") {
      await prisma.content.updateMany({
        where: { id: { in: ids } },
        data:  { status: ContentStatus.ARCHIVED },
      });

      // AuditLog for each
      await prisma.auditLog.createMany({
        data: ids.map(id => ({
          action:     "BULK_ARCHIVED",
          entityType: "Content",
          entityId:   id,
          contentId:  id,
          userId:     session.user!.id,
          newValue:   { status: ContentStatus.ARCHIVED },
        })),
      });

      return NextResponse.json({ success: true, count: ids.length });
    }

    if (action === "assign-team") {
      const validTeams = Object.values(ProductionTeam) as string[];
      if (!team || !validTeams.includes(team)) {
        return NextResponse.json({ error: "Invalid team" }, { status: 400 });
      }

      await prisma.content.updateMany({
        where: { id: { in: ids } },
        data:  { assignedTeam: team as ProductionTeam },
      });

      await prisma.auditLog.createMany({
        data: ids.map(id => ({
          action:     "BULK_TEAM_ASSIGNED",
          entityType: "Content",
          entityId:   id,
          contentId:  id,
          userId:     session.user!.id,
          newValue:   { assignedTeam: team },
        })),
      });

      return NextResponse.json({ success: true, count: ids.length });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[bulk contents]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
