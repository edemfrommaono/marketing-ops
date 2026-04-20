"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { enqueueEmail } from "@/lib/queue/enqueue";

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

// ─── Portal token management ──────────────────────────────────────────────────

export async function createPortalToken(
  clientId: string
): Promise<{ success: true; token: string } | { success: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Non authentifié." };

  try {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return { success: false, error: "Client introuvable." };

    // Deactivate previous tokens
    await prisma.clientPortalToken.updateMany({
      where: { clientId, isActive: true },
      data:  { isActive: false },
    });

    // Create a new token (cuid default from schema)
    const portalToken = await prisma.clientPortalToken.create({
      data: {
        clientId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive:  true,
      },
    });

    const portalLink = `${process.env.NEXTAUTH_URL}/client/${portalToken.token}`;

    // Send invite email if client has an email address
    if (client.email) {
      await enqueueEmail({
        type:           "client-portal-invite",
        recipientEmail: client.email,
        recipientName:  client.name,
        data: {
          clientName: client.name,
          portalLink,
          agencyName: "Maono Ops",
          expiresAt:  portalToken.expiresAt
            ? portalToken.expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
            : undefined,
        },
      });
    }

    revalidatePath(`/admin/clients/${clientId}/portal`);
    return { success: true, token: portalToken.token };
  } catch (err) {
    console.error("[createPortalToken]", err);
    return { success: false, error: "Erreur lors de la création du lien." };
  }
}

export async function revokePortalToken(
  tokenId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Non authentifié." };

  try {
    const existing = await prisma.clientPortalToken.findUnique({ where: { id: tokenId } });
    if (!existing) return { success: false, error: "Token introuvable." };

    await prisma.clientPortalToken.update({
      where: { id: tokenId },
      data:  { isActive: false },
    });

    revalidatePath(`/admin/clients/${existing.clientId}/portal`);
    return { success: true };
  } catch (err) {
    console.error("[revokePortalToken]", err);
    return { success: false, error: "Erreur lors de la révocation." };
  }
}
