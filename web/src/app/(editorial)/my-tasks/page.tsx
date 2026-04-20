import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TaskStatus } from "@prisma/client";

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; icon: string }> = {
  PENDING:     { label: "En attente",  color: "bg-slate-100 text-slate-600",    icon: "schedule"     },
  IN_PROGRESS: { label: "En cours",    color: "bg-blue-50 text-blue-700",       icon: "play_circle"  },
  BLOCKED:     { label: "Bloqué",      color: "bg-red-50 text-red-700",         icon: "block"        },
  COMPLETED:   { label: "Terminé",     color: "bg-emerald-50 text-emerald-700", icon: "check_circle" },
};

export default async function MyTasksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const tasks = await prisma.productionTask.findMany({
    where:   { assignedToId: session.user.id },
    include: {
      content: {
        select: {
          id: true, title: true, status: true,
          calendarEntry: {
            select: {
              platform: true,
              campaign: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
    orderBy: [{ deadline: "asc" }],
  });

  const grouped = {
    IN_PROGRESS: tasks.filter(t => t.status === "IN_PROGRESS"),
    PENDING:     tasks.filter(t => t.status === "PENDING"),
    BLOCKED:     tasks.filter(t => t.status === "BLOCKED"),
    COMPLETED:   tasks.filter(t => t.status === "COMPLETED"),
  };

  const activeTasks    = tasks.filter(t => t.status !== "COMPLETED").length;
  const overdueTasks   = tasks.filter(t =>
    t.deadline && t.deadline < new Date() && t.status !== "COMPLETED"
  ).length;

  return (
    <div className="px-8 py-8 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Mes Tâches</h1>
        <p className="text-sand text-sm mt-1">
          {activeTasks} tâche{activeTasks !== 1 ? "s" : ""} active{activeTasks !== 1 ? "s" : ""}
          {overdueTasks > 0 && (
            <span className="ml-2 text-red-500 font-semibold">· {overdueTasks} en retard</span>
          )}
        </p>
      </div>

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-block-light flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-sand text-[32px]">task_alt</span>
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">Aucune tâche assignée</h3>
          <p className="text-sand text-sm">Les tâches assignées à votre compte apparaîtront ici.</p>
        </div>
      )}

      {/* Grouped sections */}
      {(["IN_PROGRESS", "PENDING", "BLOCKED", "COMPLETED"] as TaskStatus[]).map(status => {
        const group = grouped[status];
        if (group.length === 0) return null;
        const cfg = STATUS_CONFIG[status];
        return (
          <div key={status} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.color}`}>
                <span className="material-symbols-outlined text-[14px]">{cfg.icon}</span>
                {cfg.label}
              </span>
              <span className="text-xs text-sand">{group.length} tâche{group.length !== 1 ? "s" : ""}</span>
              <div className="flex-1 h-px bg-secondary/10" />
            </div>

            <div className="space-y-3">
              {group.map(task => {
                const isOverdue = task.deadline && task.deadline < new Date() && task.status !== "COMPLETED";
                return (
                  <Link
                    key={task.id}
                    href={task.content ? `/contents/${task.content.id}` : "#"}
                    className="card rounded-xl p-5 flex items-start gap-4 hover:shadow-md transition-all group block"
                  >
                    <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-secondary text-[18px]">{cfg.icon}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground group-hover:text-secondary transition-colors">
                            {task.title}
                          </p>
                          {task.content && (
                            <p className="text-xs text-sand mt-0.5">
                              {task.content.calendarEntry?.campaign?.name ?? "—"}
                              <span className="mx-1 opacity-40">·</span>
                              {task.content.title}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {task.content && (
                            <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-block-light text-sand border border-secondary/10">
                              {task.content.calendarEntry?.platform ?? "—"}
                            </span>
                          )}
                          {task.deadline && (
                            <span className={`text-xs font-medium ${isOverdue ? "text-red-500" : "text-sand"}`}>
                              {isOverdue ? "⚠️ " : ""}
                              {task.deadline.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
