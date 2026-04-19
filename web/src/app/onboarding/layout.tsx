import type { ReactNode } from "react";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Minimal header */}
      <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-editorial flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[18px]">auto_awesome</span>
          </div>
          <span className="text-sm font-bold text-anthracite">Maono Ops</span>
        </div>
        <span className="text-xs text-slate-400">Configuration initiale</span>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center py-12 px-4">
        {children}
      </div>
    </div>
  );
}
