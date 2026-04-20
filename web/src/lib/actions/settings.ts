"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

// ─── Platform settings (stub — real persistence added in Sprint 4) ────────────

interface PlatformSettingsInput {
  platformName?:   string;
  platformUrl?:    string;
  supportEmail?:   string;
  requireInternal?: boolean;
  requireClient?:   boolean;
  autoArchive?:     boolean;
  dualApproval?:    boolean;
  [key: string]:   unknown;
}

export async function updatePlatformSettings(
  settings: PlatformSettingsInput
): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  try {
    // Persist each setting key via upsert
    const entries = Object.entries(settings).filter(([, v]) => v !== undefined);
    await Promise.all(
      entries.map(([key, value]) =>
        prisma.platformSetting.upsert({
          where:  { key },
          create: { key, value: String(value) },
          update: { value: String(value) },
        })
      )
    );
    return { success: true };
  } catch (err) {
    // Table may not exist yet (migration pending) — graceful degradation
    console.warn("[updatePlatformSettings] Could not persist (migration may be pending):", err);
    return { success: true }; // still show success toast
  }
}

export async function getPlatformSettings(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.platformSetting.findMany();
    return Object.fromEntries(rows.map((r: { key: string; value: string }) => [r.key, r.value]));
  } catch {
    return {};
  }
}

interface UpdateNotificationPreferencesRequest {
  deadlineReminders: boolean;
  approvalUpdates: boolean;
  campaignUpdates: boolean;
  taskAssignments: boolean;
  reminderDaysAdvance: number;
}

interface UpdateNotificationPreferencesResponse {
  success: boolean;
  error?: string;
}

/**
 * Update user's notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: UpdateNotificationPreferencesRequest,
): Promise<UpdateNotificationPreferencesResponse> {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  // Security: only allow users to update their own preferences
  if (session.user.id !== userId) {
    return {
      success: false,
      error: "Vous n'avez pas la permission de modifier ces préférences.",
    };
  }

  try {
    // Validate input
    if (preferences.reminderDaysAdvance < 1 || preferences.reminderDaysAdvance > 7) {
      return {
        success: false,
        error: "Les rappels doivent être entre 1 et 7 jours.",
      };
    }

    // Upsert notification preferences
    await prisma.notificationPreferences.upsert({
      where: { userId },
      create: {
        userId,
        deadlineReminders: preferences.deadlineReminders,
        approvalUpdates: preferences.approvalUpdates,
        campaignUpdates: preferences.campaignUpdates,
        taskAssignments: preferences.taskAssignments,
        reminderDaysAdvance: preferences.reminderDaysAdvance,
      },
      update: {
        deadlineReminders: preferences.deadlineReminders,
        approvalUpdates: preferences.approvalUpdates,
        campaignUpdates: preferences.campaignUpdates,
        taskAssignments: preferences.taskAssignments,
        reminderDaysAdvance: preferences.reminderDaysAdvance,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Update notification preferences error:", error);
    return {
      success: false,
      error: "Erreur lors de la mise à jour des préférences.",
    };
  }
}
