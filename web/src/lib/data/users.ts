import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export interface UserRow {
  id:        string;
  name:      string | null;
  email:     string | null;
  role:      UserRole;
  createdAt: string;
}

export async function getUsers(): Promise<UserRow[]> {
  try {
    const users = await prisma.user.findMany({
      orderBy: { id: "asc" },
      select: {
        id:   true,
        name: true,
        email: true,
        role: true,
      },
    });

    // User model has no createdAt — use fallback
    return users.map(u => ({
      id:        u.id,
      name:      u.name,
      email:     u.email,
      role:      u.role,
      createdAt: "—",
    }));
  } catch {
    return [];
  }
}
