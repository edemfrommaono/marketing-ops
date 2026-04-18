"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CampaignStatus, Platform } from "@prisma/client";

export async function createCampaign(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const name      = formData.get("name")       as string;
  const clientId  = formData.get("clientId")   as string;
  const objective = formData.get("objective")  as string;
  const startDate = formData.get("startDate")  as string;
  const endDate   = formData.get("endDate")    as string;
  const platforms = formData.getAll("platforms") as Platform[];

  // KPI targets
  const reach      = Number(formData.get("reach")      || 0);
  const engagement = Number(formData.get("engagement") || 0);
  const ctr        = Number(formData.get("ctr")        || 0);
  const conversion = Number(formData.get("conversion") || 0);

  try {
    const campaign = await prisma.campaign.create({
      data: {
        name,
        clientId,
        objective,
        startDate:   new Date(startDate),
        endDate:     new Date(endDate),
        platforms,
        status:      CampaignStatus.DRAFT,
        createdById: session.user.id,
        kpiTargets:  { reach, engagement, ctr, conversion },
      },
    });
    revalidatePath("/campaigns");
    redirect(`/campaigns/${campaign.id}`);
  } catch (err) {
    // Log silently; redirect would have thrown
    throw err;
  }
}
