"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export type CreateClientResult =
  | { success: true;  client: { id: string; name: string } }
  | { success: false; error: string };

export async function createClient(formData: FormData): Promise<CreateClientResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié." };
  }

  const name    = (formData.get("name")    as string | null)?.trim();
  const company = (formData.get("company") as string | null)?.trim();
  const email   = (formData.get("email")   as string | null)?.trim();

  if (!name || !company || !email) {
    return { success: false, error: "Nom, société et email sont requis." };
  }

  try {
    const client = await prisma.client.create({
      data: { name, company, email },
      select: { id: true, name: true },
    });

    revalidatePath("/admin/clients");
    revalidatePath("/campaigns/new");

    return { success: true, client };
  } catch (err: unknown) {
    // Unique constraint on email
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return { success: false, error: "Un client avec cet email existe déjà." };
    }
    console.error("[createClient]", err);
    return { success: false, error: "Erreur lors de la création du client." };
  }
}
