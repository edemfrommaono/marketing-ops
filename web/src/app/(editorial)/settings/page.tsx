import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import NotificationPreferencesForm from "@/components/forms/NotificationPreferencesForm";

export const metadata = {
  title: "Paramètres de notifications",
  description: "Gérez vos préférences de notifications par email",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  // Fetch user's notification preferences
  const prefs = await prisma.notificationPreferences.findUnique({
    where: { userId: session.user.id },
  });

  // Default preferences if none exist
  const preferences = prefs || {
    userId: session.user.id,
    deadlineReminders: true,
    approvalUpdates: true,
    campaignUpdates: true,
    taskAssignments: true,
    reminderDaysAdvance: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
        <p className="text-sand text-sm mt-2">
          Gérez vos préférences de notifications et d'alertes
        </p>
      </div>

      {/* Settings Card */}
      <div className="card rounded-2xl overflow-hidden">
        {/* Section: Notifications */}
        <div className="border-b border-secondary/10">
          <div className="px-8 py-6 border-b border-secondary/10 bg-block-light">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">notifications</span>
              Notifications par Email
            </h2>
            <p className="text-sand text-sm mt-1">
              Contrôlez les types de notifications que vous recevez
            </p>
          </div>

          <NotificationPreferencesForm initialPreferences={preferences} userId={session.user.id} />
        </div>

        {/* Info Section */}
        <div className="px-8 py-6 bg-tertiary/10 border-t border-tertiary/20">
          <p className="text-sm text-sand">
            💡 <strong>Astuce :</strong> Vous pouvez gérer vos notifications à tout moment.
            Les modifications seront appliquées immédiatement.
          </p>
        </div>
      </div>
    </div>
  );
}
