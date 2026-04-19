"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Platform } from "@prisma/client";

// ── Step 2: create the first client ─────────────────────────────────────────
export async function onboardingCreateClient(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const name    = (formData.get("name")    as string | null)?.trim();
  const company = (formData.get("company") as string | null)?.trim();
  const email   = (formData.get("email")   as string | null)?.trim();

  if (!name || !company || !email) {
    redirect("/onboarding/step/2?error=missing_fields");
  }

  try {
    await prisma.client.create({ data: { name: name!, company: company!, email: email! } });
  } catch {
    redirect("/onboarding/step/2?error=db_error");
  }

  redirect("/onboarding/step/3");
}

// ── Step 3: create first campaign (optional — can skip) ──────────────────────
export async function onboardingCreateCampaign(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const name      = (formData.get("name")      as string | null)?.trim();
  const objective = (formData.get("objective") as string | null)?.trim();
  const platforms = formData.getAll("platforms") as Platform[];
  const startDate = formData.get("startDate") as string | null;
  const endDate   = formData.get("endDate")   as string | null;

  if (!name || !objective || !startDate || !endDate) {
    redirect("/onboarding/step/3?error=missing_fields");
  }

  // Find the most recently created client (created in step 2)
  const latestClient = await prisma.client.findFirst({ orderBy: { createdAt: "desc" } });
  if (!latestClient) {
    redirect("/onboarding/step/3?error=no_client");
  }

  try {
    await prisma.campaign.create({
      data: {
        name:       name!,
        objective:  objective!,
        status:     "DRAFT",
        startDate:  new Date(startDate!),
        endDate:    new Date(endDate!),
        platforms:  platforms.length > 0 ? platforms : ["INSTAGRAM"],
        clientId:   latestClient!.id,
        createdById: session.user.id,
      },
    });
  } catch {
    redirect("/onboarding/step/3?error=db_error");
  }

  redirect("/onboarding/step/4");
}

// ── Step 5: mark onboarding as complete ─────────────────────────────────────
export async function completeOnboarding(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { onboardingCompleted: true },
  }).catch(console.error);

  redirect("/strategy");
}

// ── Skip step (just advance) ─────────────────────────────────────────────────
export async function skipOnboardingStep(nextStep: number): Promise<void> {
  redirect(`/onboarding/step/${nextStep}`);
}
