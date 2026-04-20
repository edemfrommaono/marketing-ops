"use client";

import { useState, useTransition } from "react";
import { SlidePanel } from "@/components/ui/SlidePanel";
import { inviteCollaborator } from "@/lib/actions/notifications";
import { UserRole } from "@prisma/client";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin", STRATEGIST: "Stratégiste", CONTENT_PLANNER: "Planificateur",
  DESIGNER: "Designer", PHOTOGRAPHER: "Photographe", VIDEOGRAPHER: "Vidéaste",
  SOCIAL_MEDIA_MANAGER: "Social Media",
};

interface Props {
  currentUserId: string;
}

export function InviteUserPanel({ currentUserId }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.DESIGNER);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError("L'email est requis."); return; }
    if (!email.includes("@")) { setError("Email invalide."); return; }

    startTransition(async () => {
      try {
        await inviteCollaborator(email.trim(), role, currentUserId, "Maono Ops");
        setSuccess(true);
        setEmail("");
        setRole(UserRole.DESIGNER);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erreur lors de l'invitation.");
      }
    });
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setSuccess(false);
    setEmail("");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-cta flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-[18px]">person_add</span>
        Inviter un utilisateur
      </button>

      <SlidePanel open={open} onClose={handleClose} title="Inviter un collaborateur">
        {success ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-emerald-500 text-[32px]">mark_email_read</span>
            </div>
            <h3 className="text-base font-bold text-foreground mb-2">Invitation envoyée !</h3>
            <p className="text-sm text-sand mb-6">
              Un email a été envoyé à <strong>{email || "l'invité"}</strong> avec un lien de connexion valable 7 jours.
            </p>
            <button
              onClick={() => { setSuccess(false); setEmail(""); }}
              className="btn-cta"
            >
              Inviter un autre
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <p className="text-sm text-sand">
              L'invité recevra un email avec un lien pour créer son mot de passe et accéder à la plateforme.
            </p>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {error}
              </div>
            )}

            <div>
              <label className="label-base mb-1.5">Adresse email *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="collaborateur@example.com"
                className="input-base"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label-base mb-1.5">Rôle *</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="input-base"
              >
                {Object.entries(ROLE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div className="bg-block-light rounded-lg p-4 text-xs text-sand space-y-1">
              <p className="font-semibold text-foreground">Ce que recevra l'invité :</p>
              <p>• Un email avec un lien de connexion sécurisé</p>
              <p>• Le lien expire dans 7 jours</p>
              <p>• Il pourra définir son mot de passe dès la première connexion</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={handleClose} className="btn-secondary flex-1">
                Annuler
              </button>
              <button type="submit" disabled={isPending} className="btn-cta flex-1 disabled:opacity-50">
                {isPending ? "Envoi en cours…" : "Envoyer l'invitation"}
              </button>
            </div>
          </form>
        )}
      </SlidePanel>
    </>
  );
}
