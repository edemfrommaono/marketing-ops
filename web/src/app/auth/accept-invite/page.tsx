"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { acceptInvite } from "@/lib/actions/auth";

function getStrength(p: string): number {
  let s = 0;
  if (p.length >= 8)          s++;
  if (/[A-Z]/.test(p))        s++;
  if (/[0-9]/.test(p))        s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}
const STRENGTH_COLORS = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-emerald-400"];
const STRENGTH_LABELS = ["Très faible", "Faible", "Moyen", "Fort"];

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  const strength = getStrength(password);

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    // Validate token format and parameters
    if (!token || !email || token.length !== 64) {
      setError("Lien d'invitation invalide ou expiré.");
      setIsValidating(false);
      return;
    }

    setIsValid(true);
    setIsValidating(false);
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!password || !confirmPassword) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await acceptInvite({
        token: token!,
        email: email!,
        password,
      });

      if (!result.success) {
        setError(result.error || "Erreur lors de l'acceptation de l'invitation.");
        setIsLoading(false);
        return;
      }

      // Refresh to pick up the new session created server-side, then navigate
      router.refresh();
      router.push("/strategy");
    } catch (err) {
      console.error("Accept invite error:", err);
      setError("Erreur serveur. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="w-full max-w-md">
        <div className="card rounded-2xl overflow-hidden p-8">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="w-full max-w-md">
        <div className="card rounded-2xl overflow-hidden">
          <div className="px-8 py-6 border-b border-secondary/10">
            <h1 className="text-xl font-bold text-foreground">Lien invalide</h1>
          </div>

          <div className="px-8 py-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-400 text-[32px]">error</span>
            </div>

            <p className="text-sand text-sm mb-6">
              Ce lien d'invitation est invalide ou a expiré.
            </p>

            <p className="text-sand text-xs mb-4">
              Si vous avez reçu un email d'invitation, veuillez:
            </p>

            <ul className="text-left text-sand text-xs space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">check</span>
                Vérifier le lien dans votre email
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">check</span>
                Vérifier que le lien n'a pas expiré (7 jours)
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">check</span>
                Contacter votre administrateur pour un nouveau lien
              </li>
            </ul>

            <Link
              href="/auth/login"
              className="btn-cta inline-flex items-center gap-2"
            >
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="card rounded-2xl overflow-hidden">
        <div className="px-8 py-6 border-b border-secondary/10">
          <h1 className="text-xl font-bold text-foreground">Bienvenue !</h1>
          <p className="text-sand text-sm mt-1">Configurez votre mot de passe</p>
        </div>

        <div className="px-8 py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email display */}
            <div className="bg-block-light rounded-lg p-3 mb-4">
              <p className="text-xs text-sand mb-1">Email</p>
              <p className="text-sm font-medium text-foreground">{email}</p>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm">
                <span className="material-symbols-outlined text-[18px] flex-shrink-0">error</span>
                {error}
              </div>
            )}

            {/* Password field */}
            <div>
              <label className="label-base mb-1.5">Mot de passe *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Au moins 8 caractères"
                className="input-base"
              />
              {/* Strength indicator */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i < strength ? STRENGTH_COLORS[strength - 1] : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-2xs text-sand">{STRENGTH_LABELS[Math.max(0, strength - 1)]}</p>
                </div>
              )}
            </div>

            {/* Confirm password field */}
            <div>
              <label className="label-base mb-1.5">
                Confirmer le mot de passe *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre mot de passe"
                className="input-base"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-cta w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Activation en cours..." : "Activer mon compte"}
            </button>
          </form>

          <p className="text-xs text-sand text-center mt-4">
            Vous avez déjà un compte?{" "}
            <Link href="/auth/login" className="text-secondary hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="w-full max-w-md">
      <div className="bg-card rounded-2xl border border-secondary/10 shadow-soft overflow-hidden p-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AcceptInviteForm />
    </Suspense>
  );
}
