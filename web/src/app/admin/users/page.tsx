import { getUsers } from "@/lib/data/users";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { InviteUserPanel } from "@/components/admin/InviteUserPanel";
import Link from "next/link";

const ROLES = Object.values(UserRole);

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

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin", STRATEGIST: "Stratégiste", CONTENT_PLANNER: "Planificateur",
  DESIGNER: "Designer", PHOTOGRAPHER: "Photographe", VIDEOGRAPHER: "Vidéaste",
  SOCIAL_MEDIA_MANAGER: "Social Media", CLIENT: "Client",
};

export default async function AdminUsersPage() {
  const session = await auth();
  const currentUserId = session?.user?.id ?? "";
  const users = await getUsers();

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Utilisateurs</h1>
          <p className="text-sand text-sm mt-1">{users.length} compte{users.length !== 1 ? "s" : ""}</p>
        </div>
        <InviteUserPanel currentUserId={currentUserId} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        {["Tous", "Actifs", "Inactifs"].map((f, i) => (
          <button key={f} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${i === 0 ? "bg-secondary text-background" : "bg-block text-sand hover:bg-block-light"}`}>{f}</button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sand text-[16px]">search</span>
            <input placeholder="Rechercher..." className="input-base pl-8 w-48" />
          </div>
          <select className="input-base">
            <option value="">Tous les rôles</option>
            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>)}
          </select>
        </div>
      </div>

      {/* Empty state */}
      {users.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-block-light flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-sand text-[32px]">group</span>
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">Aucun utilisateur</h3>
          <p className="text-sand text-sm">Invitez votre équipe pour commencer à collaborer.</p>
        </div>
      )}

      {/* Table */}
      {users.length > 0 && (
        <div className="card rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-secondary/10 bg-block-light/50">
                {["Utilisateur", "Rôle", "Email", ""].map(h => (
                  <th key={h} className="px-5 py-3 text-2xs font-semibold uppercase tracking-wider text-sand">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary/5">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-block-light transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-secondary">{(u.name ?? u.email ?? "?")[0].toUpperCase()}</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{u.name ?? "(Sans nom)"}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-2xs font-bold border ${ROLE_STYLES[u.role] ?? "bg-block text-sand border-secondary/10"}`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-sand">{u.email ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/admin/users/${u.id}`} className="p-1.5 rounded-lg hover:bg-block-light text-sand hover:text-secondary transition-colors">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </Link>
                      <button className="p-1.5 rounded-lg hover:bg-red-500/10 text-sand hover:text-red-400 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">block</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite info */}
      <div className="mt-6 bg-block-light rounded-xl border border-secondary/10 p-5 flex items-start gap-4">
        <span className="material-symbols-outlined text-secondary text-[22px] flex-shrink-0 mt-0.5">info</span>
        <div>
          <p className="text-sm font-semibold text-secondary">Invitation par email</p>
          <p className="text-xs text-sand mt-0.5">
            Les utilisateurs invités reçoivent un lien de connexion valable 48h.
            Un mot de passe peut être défini lors de la première connexion.
          </p>
        </div>
      </div>
    </div>
  );
}
