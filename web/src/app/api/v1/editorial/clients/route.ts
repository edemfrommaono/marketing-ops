import { prisma } from "@/lib/db";
import { ok, err, requireAuth, parseBody, paginate } from "@/lib/api";

// GET /api/v1/editorial/clients
export async function GET(req: Request) {
  const user = await requireAuth();
  if (!user) return err("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const { skip, take, page, limit } = paginate(searchParams);

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where: { isActive: true },
      skip,
      take,
      orderBy: { name: "asc" },
      include: { _count: { select: { campaigns: true } } },
    }),
    prisma.client.count({ where: { isActive: true } }),
  ]);

  return ok({ data: clients, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
}

// POST /api/v1/editorial/clients
export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return err("Unauthorized", 401);

  const body = await parseBody<{
    name: string;
    company: string;
    email: string;
    contactName?: string;
    logoUrl?: string;
  }>(req);

  if (!body) return err("Invalid JSON body");
  if (!body.name || !body.company || !body.email) {
    return err("Missing required fields: name, company, email");
  }

  const existing = await prisma.client.findUnique({ where: { email: body.email } });
  if (existing) return err("A client with this email already exists", 409);

  const client = await prisma.client.create({
    data: {
      name: body.name,
      company: body.company,
      email: body.email,
      contactName: body.contactName,
      logoUrl: body.logoUrl,
    },
  });

  return ok(client, 201);
}
