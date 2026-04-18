"use client";
import { useEffect } from "react";

export default function EditorialError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Editorial] Page error:", error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-red-500 text-[28px]">error_outline</span>
        </div>
        <h2 className="text-lg font-bold text-anthracite mb-2">Une erreur est survenue</h2>
        <p className="text-sm text-slate-400 mb-6">
          Impossible de charger cette page.{" "}
          {error.digest && (
            <span className="text-2xs font-mono text-slate-300">({error.digest})</span>
          )}
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-editorial text-white rounded-lg text-sm font-semibold hover:bg-editorial/90 transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
