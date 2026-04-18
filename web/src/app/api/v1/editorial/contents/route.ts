import { prisma } from "@/lib/db";
import { ok, err, requireAuth, parseBody, paginate } from "@/lib/api";
import { ContentFormat, ContentStatus, ProductionTeam } from "@prisma/client";

// GET /api/v1/editorial/contents
export async function GET(req: Request) {
  const user = await requireAuth();
  if (!user) return err("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const { skip, take, page, limit } = paginate(searchParams);

  const where = {
    ...(searchParams.get("status") && { status: searchParams.get("status") as ContentStatus }),
    ...(searchParams.get("assignedTeam") && { assignedTeam: searchParams.get("assignedTeam") as ProductionTeam }),
    ...(searchParams.get("calendarEntryId") && { calendarEntryId: searchParams.get("calendarEntryId")! }),
  };

  const [contents, total] = await Promise.all([
    prisma.content.findMany({
      where,
      skip,
      take,
      orderBy: { deadline: "asc" },
      include: {
        calendarEntry: {
          select: {
            id: true,
            platform: true,
            publicationDate: true,
            campaign: { select: { id: true, name: true, client: { select: { name: true } } } },
          },
        },
        approvals: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { assets: true, tasks: true } },
      },
    }),
    prisma.content.count({ where }),
  ]);

  return ok({ data: contents, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
}

// POST /api/v1/editorial/contents
export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return err("Unauthorized", 401);

  const body = await parseBody<{
    calendarEntryId: string;
    title: string;
    format: ContentFormat;
    assignedTeam: ProductionTeam;
    deadline: string;
    briefUrl?: string;
    briefNotes?: string;
  }>(req);

  if (!body) return err("Invalid JSON body");
  if (!body.calendarEntryId || !body.title || !body.format || !body.assignedTeam || !body.deadline) {
    return err("Missing required fields: calendarEntryId, title, format, assignedTeam, deadline");
  }

  const calendarEntry = await prisma.calendarEntry.findUnique({ where: { id: body.calendarEntryId } });
  if (!calendarEntry) return err("Calendar entry not found", 404);

  const content = await prisma.content.create({
    data: {
      calendarEntryId: body.calendarEntryId,
      title: body.title,
      format: body.format,
      assignedTeam: body.assignedTeam,
      deadline: new Date(body.deadline),
      briefUrl: body.briefUrl,
      briefNotes: body.briefNotes,
    },
    include: {
      calendarEntry: {
        select: { platform: true, campaign: { select: { name: true } } },
      },
    },
  });

  // Auto-create an initial Approval record
  await prisma.approval.create({
    data: { contentId: content.id },
  });

  // Auto-schedule reminders (J-7, J-3, J-1, J-0)
  const deadline = new Date(body.deadline);
  const reminders = [
    { reminderType: "J_MINUS_7" as const, days: 7 },
    { reminderType: "J_MINUS_3" as const, days: 3 },
    { reminderType: "J_MINUS_1" as const, days: 1 },
    { reminderType: "J_0" as const, days: 0 },
  ]
    .map(({ reminderType, days }) => {
      const scheduledAt = new Date(deadline);
      scheduledAt.setDate(scheduledAt.getDate() - days);
      return { contentId: content.id, reminderType, scheduledAt };
    })
    .filter(({ scheduledAt }) => scheduledAt > new Date()); // only future reminders

  if (reminders.length > 0) {
    await prisma.reminder.createMany({ data: reminders });
  }

  return ok(content, 201);
}
