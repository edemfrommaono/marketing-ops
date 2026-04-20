"use client";

import { useState, useTransition } from "react";
import { resetPassword } from "@/lib/actions/auth";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordForm() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const token         = searchParams.get("token") ?? "";
  const email         = searchParams.get("email") ?? "";

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [error,     setError]     = useState<string | null>(null);
  const [done,      setDone]      = useState(false);
  const [isPending, startTransition] = useTransition();

  // Password strength
  const getStrength = (p: string): number => {
    let s = 0;
    if (p.length >= 8)          s++;
    if (/[A-Z]/.test(p))        s++;
    if (/[0-9]/.test(p))        s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strength       = getStrength(password);
  const strengthColors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-emerald-400"];
  const strengthLabels = ["Très faible", "Faible", "Moyen", "Fort"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token || !email) { setError("Lien invalide. Veuillez refaire la demande."); return; }
    if (password.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères."); return; }
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }

    startTransition(async () => {
      const result = await resetPassword(token, email, password);
      if (result.success) {
        setDone(true);
        setTimeout(() => router.push("/auth/login"), 2000);
      } else {
        setError(result.error ?? "Erreur lors de la réinitialisation.");
      }
    });
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center p-8">
        <div className="w-full max-w-sm text-center">
          <span className="material-symbols-outlined text-red-400 text-[48px] mb-4 block">link_off</span>
          <h1 className="text-xl font-bold text-anthracite mb-2">Lien invalide</h1>
          <p className="text-slate-400 text-sm mb-6">Ce lien est invalide ou a expiré.</p>
          <Link href="/auth/forgot-password" className="inline-block py-2.5 px-5 bg-editorial text-white rounded-lg text-sm font-semibold">
            Refaire la demande
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center p-8">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-emerald-500 text-[32px]">check_circle</span>
          </div>
          <h1 className="text-xl font-bold text-anthracite mb-2">Mot de passe réinitialisé !</h1>
          <p className="text-slate-400 text-sm">Redirection vers la connexion…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-10">
          <span className="material-symbols-outlined text-editorial text-2xl">edit_calendar</span>
          <span className="text-anthracite text-lg font-semibold">Odoo Editorial</span>
        </div>

        <h1 className="text-2xl font-bold text-anthracite mb-1">Nouveau mot de passe</h1>
        <p className="text-slate-400 text-sm mb-8">Choisissez un mot de passe sécurisé.</p>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-anthracite mb-1.5">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">lock</span>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none transition-all"
              />
            </div>
            {/* Strength indicator */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[0, 1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${i < strength ? strengthColors[strength - 1] : "bg-slate-200"}`}
                    />
                  ))}
                </div>
                <p className="text-2xs text-slate-400">{strengthLabels[Math.max(0, strength - 1)]}</p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-anthracite mb-1.5">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">lock_reset</span>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm outline-none transition-all ${
                  confirm.length > 0 && confirm !== password
                    ? "border-red-300 focus:border-red-400"
                    : "border-slate-200 focus:border-editorial focus:ring-1 focus:ring-editorial/20"
                }`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 bg-editorial text-white rounded-lg text-sm font-semibold hover:bg-editorial/90 transition-colors shadow-sm disabled:opacity-50"
          >
            {isPending ? "Réinitialisation…" : "Réinitialiser le mot de passe"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link href="/auth/login" className="text-editorial hover:underline">← Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
