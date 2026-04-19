import type { Metadata } from "next";

export const metadata: Metadata = { title: "Projets" };

export default function ProjectsPage() {
  return (
    <div className="flex-1 min-h-screen">
      <main className="px-8 py-8 max-w-[1280px] mx-auto">
        <div className="mb-10">
          <h2 className="text-anthracite text-2xl font-bold mb-1">Gestion de projets</h2>
          <p className="text-slate-400 text-sm">Suivi des projets internes et livrables</p>
        </div>

        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-slate-400 text-[40px]">construction</span>
          </div>
          <h3 className="text-xl font-bold text-anthracite mb-2">Fonctionnalité à venir</h3>
          <p className="text-slate-400 text-sm max-w-md">
            La gestion de projets internes sera disponible dans une prochaine version de Maono Ops.
          </p>
        </div>
      </main>
    </div>
  );
}
