import { prisma } from "@/lib/db";

export interface ClientRow {
  id:          string;
  name:        string;
  company:     string;
  email:       string;
  contactName: string | null;
  isActive:    boolean;
  createdAt:   string;
  campaigns:   number;
}

export async function getClients(): Promise<ClientRow[]> {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id:          true,
        name:        true,
        company:     true,
        email:       true,
        contactName: true,
        isActive:    true,
        createdAt:   true,
        _count: { select: { campaigns: true } },
      },
    });

    return clients.map(c => ({
      id:          c.id,
      name:        c.name,
      company:     c.company,
      email:       c.email,
      contactName: c.contactName,
      isActive:    c.isActive,
      createdAt:   c.createdAt.toLocaleDateString("fr-FR", { month: "short", year: "numeric" }),
      campaigns:   c._count.campaigns,
    }));
  } catch {
    return [];
  }
}

/** Lightweight list for dropdowns */
export async function getClientOptions(): Promise<{ id: string; name: string }[]> {
  try {
    return await prisma.client.findMany({
      where:   { isActive: true },
      select:  { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } catch {
    return [];
  }
}
