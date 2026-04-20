import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { updateUserRole, resendInvite, deactivateUser, activateUser } from "@/lib/actions/auth";
import { UserRole } from "@prisma/client";

interface Props {
  params: { id: string };
  searchParams: { success?: string; };
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin", STRATEGIST: "Stratégiste", CONTENT_PLANNER: "Planificateur",
  DESIGNER: "Designer", PHOTOGRAPHER: "Photographe", VIDEOGRAPHER: "Vidéaste",
  SOCIAL_MEDIA_MANAGER: "Social Media", CLIENT: "Client",
};

const ROLE_STYLES: Record<string, string> = {
  ADMIN:               "bg-red-50 text-red-700 border-red-200",
  STRATEGIST:          "bg-violet-50 text-violet-700 border-violet-200",
  CONTENT_PLANNER:     "bg-blue-50 text-blue-700 border-blue-200",
  DESIGNER:            "bg-pink-50 text-pink-700 border-pink-200",
  VIDEOGRAPHER:        "bg-amber-50 text-amber-700 border-amber-200",
  PHOTOGRAPHER:        "bg-emerald-50 text-emerald-700 border-emerald-200",
  SOCIAL_MEDIA_MANAGER:"bg-cyan-50 text-cyan-700 border-cyan-200",
  CLIENT:              "bg-slate-100 text-slate-600 border-slate-200",
};

export default async function UserDetailPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const [user, taskCount, contentCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: params.id },
      include: {
        assignedTasks: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { content: { select: { title: true } } },
        },
      },
    }),
    prisma.productionTask.count({ where: { assignedToId: params.id } }),
    prisma.productionTask.count({ where: { assignedToId: params.id, status: "COMPLETED" } }),
  ]);

  if (!user) redirect("/admin/users");

  // Server Actions
  async function handleRoleUpdate(formData: FormData) {
    "use server";
    const role = formData.get("role") as UserRole;
    if (role) await updateUserRole(params.id, role);
    redirect(`/admin/users/${params.id}?success=role`);
  }

  async function handleResendInvite() {
    "use server";
    await resendInvite(params.id);
    redirect(`/admin/users/${params.id}?success=invite`);
  }

  async function handleDeactivate() {
    "use server";
    await deactivateUser(params.id);
    redirect(`/admin/users/${params.id}?success=deactivated`);
  }

  async function handleActivate() {
    "use server";
    await activateUser(params.id);
    redirect(`/admin/users/${params.id}?success=activated`);
  }

  const isInvitePending = !user.emailVerified;

  return (
    <div className="max-w-[800px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/users"
          className="p-2 rounded-lg hover:bg-block-light text-sand hover:text-secondary transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{user.name ?? "(Sans nom)"}</h1>
          <p className="text-sand text-sm mt-1">{user.email}</p>
        </div>
      </div>

      {/* Success banners */}
      {searchParams.success === "role" && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 mb-6 text-sm">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          Rôle mis à jour avec succès.
        </div>
      )}
      {searchParams.success === "invite" && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-4 py-3 mb-6 text-sm">
          <span className="material-symbols-outlined text-[16px]">mark_email_read</span>
          Invitation renvoyée avec succès.
        </div>
      )}
      {searchParams.success === "deactivated" && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-3 mb-6 text-sm">
          <span className="material-symbols-outlined text-[16px]">block</span>
          Compte désactivé. L&apos;utilisateur ne peut plus se connecter.
        </div>
      )}
      {searchParams.success === "activated" && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 mb-6 text-sm">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          Compte réactivé avec succès.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Tâches assignées", value: taskCount, icon: "task" },
          { label: "Tâches complétées", value: contentCount, icon: "task_alt" },
          { label: "Statut", value: !user.isActive ? "Désactivé" : isInvitePending ? "En attente" : "Actif", icon: !user.isActive ? "block" : isInvitePending ? "hourglass_empty" : "verified_user" },
        ].map(({ label, value, icon }) => (
          <div key={label} className="card rounded-xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-secondary text-[20px]">{icon}</span>
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-sand">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Role */}
      <div className="card rounded-xl p-6 mb-6">
        <h2 className="text-sm font-bold text-foreground mb-4">Rôle</h2>
        <form action={handleRoleUpdate} className="flex items-center gap-3">
          <select
            name="role"
            defaultValue={user.role}
            className="input-base flex-1"
          >
            {Object.values(UserRole).filter(r => r !== "CLIENT").map(r => (
              <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>
            ))}
          </select>
          <button type="submit" className="btn-cta whitespace-nowrap">
            Enregistrer
          </button>
        </form>
        <div className="mt-3">
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-2xs font-bold border ${ROLE_STYLES[user.role] ?? "bg-block text-sand border-secondary/10"}`}>
            Actuel : {ROLE_LABELS[user.role] ?? user.role}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="card rounded-xl p-6 mb-6">
        <h2 className="text-sm font-bold text-foreground mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          {isInvitePending && (
            <form action={handleResendInvite}>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 border border-secondary/20 rounded-lg text-sm text-secondary hover:bg-secondary/5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">forward_to_inbox</span>
                Renvoyer l'invitation
              </button>
            </form>
          )}
          {user.isActive ? (
            <form action={handleDeactivate}>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">block</span>
                Désactiver le compte
              </button>
            </form>
          ) : (
            <form action={handleActivate}>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 border border-emerald-200 rounded-lg text-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Réactiver le compte
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Recent tasks */}
      {user.assignedTasks.length > 0 && (
        <div className="card rounded-xl p-6">
          <h2 className="text-sm font-bold text-foreground mb-4">Tâches récentes</h2>
          <div className="space-y-2">
            {user.assignedTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between py-2 border-b border-secondary/5 last:border-0">
                <div>
                  <p className="text-sm text-foreground font-medium">{task.title}</p>
                  {task.content && (
                    <p className="text-2xs text-sand mt-0.5">{task.content.title}</p>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-2xs font-semibold ${
                  task.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" :
                  task.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-700" :
                  "bg-block-light text-sand"
                }`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
