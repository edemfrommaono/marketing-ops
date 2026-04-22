"use server";

import { apiClient } from "@/lib/api-client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function onboardingCreateClient(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const name    = (formData.get("name")    as string | null)?.trim();
  const company = (formData.get("company") as string | null)?.trim();
  const email   = (formData.get("email")   as string | null)?.trim();

  if (!name || !company || !email) {
    redirect("/onboarding/step/2?error=missing_fields");
  }

  const response = await apiClient.post("/onboarding/client", { name, company, email });

  if (response.error) {
    redirect("/onboarding/step/2?error=api_error");
  }

  redirect("/onboarding/step/3");
}

export async function onboardingCreateCampaign(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const name      = (formData.get("name")      as string | null)?.trim();
  const objective = (formData.get("objective") as string | null)?.trim();
  const platforms = formData.getAll("platforms");
  const startDate = formData.get("startDate") as string | null;
  const endDate   = formData.get("endDate")   as string | null;

  if (!name || !objective || !startDate || !endDate) {
    redirect("/onboarding/step/3?error=missing_fields");
  }

  const response = await apiClient.post("/onboarding/campaign", {
    name,
    objective,
    startDate,
    endDate,
    platforms,
  });

  if (response.error) {
    redirect("/onboarding/step/3?error=api_error");
  }

  redirect("/onboarding/step/4");
}

export async function completeOnboarding(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const response = await apiClient.post("/onboarding/complete", {});

  if (response.error) {
    console.error(response.error);
  }

  redirect("/strategy");
}

export async function skipOnboardingStep(nextStep: number): Promise<void> {
  redirect(`/onboarding/step/${nextStep}`);
}
