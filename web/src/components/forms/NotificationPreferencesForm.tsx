"use client";

import { useState } from "react";
import { updateNotificationPreferences } from "@/lib/actions/settings";

interface NotificationPreferencesFormProps {
  initialPreferences: {
    deadlineReminders: boolean;
    approvalUpdates: boolean;
    campaignUpdates: boolean;
    taskAssignments: boolean;
    reminderDaysAdvance: number;
  };
  userId: string;
}

export default function NotificationPreferencesForm({
  initialPreferences,
  userId,
}: NotificationPreferencesFormProps) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleToggle = (key: keyof typeof preferences) => {
    if (typeof preferences[key] === "boolean") {
      setPreferences((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));
    }
  };

  const handleDaysChange = (value: number) => {
    setPreferences((prev) => ({
      ...prev,
      reminderDaysAdvance: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const result = await updateNotificationPreferences(userId, preferences);

      if (result.success) {
        setMessage({
          type: "success",
          text: "Vos préférences ont été mises à jour avec succès.",
        });
        // Auto-hide success message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({
          type: "error",
          text: result.error || "Erreur lors de la mise à jour.",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Erreur serveur. Veuillez réessayer.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="divide-y divide-secondary/10">
      {/* Deadline Reminders */}
      <div className="px-8 py-6 hover:bg-block-light transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-400">schedule</span>
              Rappels de deadline
            </h3>
            <p className="text-sm text-sand mt-1">
              Recevez des alertes quand une deadline approche
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.deadlineReminders}
              onChange={() => handleToggle("deadlineReminders")}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-block peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-secondary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-block-light after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary" />
          </label>
        </div>

        {preferences.deadlineReminders && (
          <div className="mt-4 p-4 bg-block-light rounded-lg border border-secondary/10">
            <label className="block text-sm font-medium text-foreground mb-3">
              Alerte
              <span className="text-sm font-normal text-sand"> (jours avant deadline)</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="7"
                value={preferences.reminderDaysAdvance}
                onChange={(e) => handleDaysChange(Number(e.target.value))}
                className="flex-1 accent-secondary"
              />
              <span className="text-sm font-bold text-secondary whitespace-nowrap">
                J-{preferences.reminderDaysAdvance}
              </span>
            </div>
            <p className="text-xs text-sand mt-2">
              Vous recevrez une alerte {preferences.reminderDaysAdvance} jour
              {preferences.reminderDaysAdvance > 1 ? "s" : ""} avant chaque deadline
            </p>
          </div>
        )}
      </div>

      {/* Approval Updates */}
      <div className="px-8 py-6 hover:bg-block-light transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400">check_circle</span>
              Mises à jour d'approbation
            </h3>
            <p className="text-sm text-sand mt-1">
              Notifié quand votre contenu est approuvé ou nécessite une révision
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.approvalUpdates}
              onChange={() => handleToggle("approvalUpdates")}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-block peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-secondary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-block-light after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary" />
          </label>
        </div>
      </div>

      {/* Campaign Updates */}
      <div className="px-8 py-6 hover:bg-block-light transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="material-symbols-outlined text-violet-400">campaign</span>
              Mises à jour de campagne
            </h3>
            <p className="text-sm text-sand mt-1">
              Notifié au lancement d'une campagne
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.campaignUpdates}
              onChange={() => handleToggle("campaignUpdates")}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-block peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-secondary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-block-light after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary" />
          </label>
        </div>
      </div>

      {/* Task Assignments */}
      <div className="px-8 py-6 hover:bg-block-light transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400">assignment</span>
              Assignations de tâches
            </h3>
            <p className="text-sm text-sand mt-1">
              Notifié quand une tâche vous est assignée
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.taskAssignments}
              onChange={() => handleToggle("taskAssignments")}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-block peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-secondary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-block-light after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary" />
          </label>
        </div>
      </div>

      {/* Submit Section */}
      <div className="px-8 py-6 bg-block-light flex items-center justify-between">
        {message && (
          <div
            className={`text-sm font-medium ${
              message.type === "success"
                ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-lg"
                : "text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg"
            }`}
          >
            {message.type === "success" ? "✓" : "✕"} {message.text}
          </div>
        )}
        <button
          type="submit"
          disabled={isSaving}
          className="btn-cta ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
