import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { updateProfile, changePassword } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import { SignOutButton } from "@/components/ui/SignOutButton";

const ROLE_LABELS: Record<string, string> = {
  ADMIN:               "Administrateur",
  STRATEGIST:          "Stratège",
  CONTENT_PLANNER:     "Planificateur de contenu",
  DESIGNER:            "Designer",
  PHOTOGRAPHER:        "Photographe",
  VIDEOGRAPHER:        "Vidéaste",
  SOCIAL_MEDIA_MANAGER:"Social Media Manager",
  CLIENT:              "Client",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN:               "bg-red-50 text-red-700",
  STRATEGIST:          "bg-purple-50 text-purple-700",
  CONTENT_PLANNER:     "bg-blue-50 text-blue-700",
  DESIGNER:            "bg-pink-50 text-pink-700",
  PHOTOGRAPHER:        "bg-amber-50 text-amber-700",
  VIDEOGRAPHER:        "bg-orange-50 text-orange-700",
  SOCIAL_MEDIA_MANAGER:"bg-teal-50 text-teal-700",
  CLIENT:              "bg-slate-100 text-slate-600",
};

interface Props {
  searchParams: { success?: string; error?: string };
}

export default async function ProfilePage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id:    true,
      name:  true,
      email: true,
      role:  true,
      image: true,
      isActive:           true,
      onboardingCompleted:true,
      emailVerified:      true,
      _count: { select: { assignedTasks: true, approvals: true } },
    },
  });

  if (!user) redirect("/auth/login");

  // ─── Server Actions ──────────────────────────────────────────────────────────
  async function handleUpdateProfile(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const result = await updateProfile({ name: name?.trim() || undefined });
    revalidatePath("/profile");
    if (result.success) {
      redirect("/profile?success=name");
    } else {
      redirect(`/profile?error=${encodeURIComponent(result.error ?? "Erreur")}`);
    }
  }

  async function handleChangePassword(formData: FormData) {
    "use server";
    const current = formData.get("currentPassword") as string;
    const next    = formData.get("newPassword")     as string;
    const confirm = formData.get("confirmPassword") as string;

    if (next !== confirm) {
      redirect("/profile?error=Les+mots+de+passe+ne+correspondent+pas.");
    }

    const result = await changePassword(current, next);
    revalidatePath("/profile");
    if (result.success) {
      redirect("/profile?success=password");
    } else {
      redirect(`/profile?error=${encodeURIComponent(result.error ?? "Erreur")}`);
    }
  }

  const initials = (user.name ?? user.email ?? "?")
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex-1 min-h-screen">
      <main className="px-8 py-8 max-w-[860px] mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/strategy"
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-anthracite transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-anthracite">Mon profil</h1>
            <p className="text-slate-400 text-sm mt-0.5">Gérez vos informations personnelles et votre mot de passe</p>
          </div>
        </div>

        {/* Banners */}
        {searchParams.success === "name" && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 mb-6 text-sm">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            Profil mis à jour avec succès.
          </div>
        )}
        {searchParams.success === "password" && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 mb-6 text-sm">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            Mot de passe modifié avec succès.
          </div>
        )}
        {searchParams.error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
            <span className="material-symbols-outlined text-[18px] flex-shrink-0">error</span>
            {searchParams.error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">

          {/* Identity card */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-6">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-editorial/10 border-2 border-editorial/20 flex items-center justify-center flex-shrink-0">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt="" className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  <span className="text-editorial text-xl font-bold">{initials}</span>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-lg font-bold text-anthracite">{user.name ?? "—"}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[user.role] ?? "bg-slate-100 text-slate-600"}`}>
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{user.email}</p>

                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="material-symbols-outlined text-[14px]">task_alt</span>
                    {user._count.assignedTasks} tâche{user._count.assignedTasks !== 1 ? "s" : ""} assignée{user._count.assignedTasks !== 1 ? "s" : ""}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="material-symbols-outlined text-[14px]">rate_review</span>
                    {user._count.approvals} révision{user._count.approvals !== 1 ? "s" : ""}
                  </div>
                  {user.emailVerified && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      Email vérifié
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Edit name */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5">
              Informations personnelles
            </h3>
            <form action={handleUpdateProfile} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-anthracite mb-1.5">
                  Nom complet
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  defaultValue={user.name ?? ""}
                  placeholder="Votre nom"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-anthracite mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email ?? ""}
                  disabled
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400 mt-1">L&apos;email ne peut pas être modifié. Contactez un admin si nécessaire.</p>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-editorial text-white rounded-lg text-sm font-semibold hover:bg-editorial/90 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  Enregistrer
                </button>
              </div>
            </form>
          </div>

          {/* Change password */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5">
              Changer le mot de passe
            </h3>
            <form action={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-anthracite mb-1.5">
                  Mot de passe actuel *
                </label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none transition-all"
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-anthracite mb-1.5">
                  Nouveau mot de passe *
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Au moins 8 caractères"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none transition-all"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-anthracite mb-1.5">
                  Confirmer le nouveau mot de passe *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Répétez le mot de passe"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none transition-all"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-editorial text-white rounded-lg text-sm font-semibold hover:bg-editorial/90 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                  Changer le mot de passe
                </button>
              </div>
            </form>
          </div>

          {/* Danger zone — link to admin if self is admin */}
          <div className="bg-red-50 rounded-xl border border-red-100 p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-red-700">Zone de déconnexion</p>
              <p className="text-xs text-red-500 mt-0.5">Terminer votre session sur cet appareil.</p>
            </div>
            <SignOutButton />
          </div>

        </div>
      </main>
    </div>
  );
}
