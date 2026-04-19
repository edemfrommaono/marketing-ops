import Link from "next/link";

export default function ProjectDetailPage() {
  return (
    <div className="flex-1 min-h-screen">
      <main className="px-8 py-8 max-w-[1280px] mx-auto">

        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <Link href="/projects" className="hover:text-anthracite transition-colors">Projets</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-anthracite font-medium">Détail</span>
        </div>

        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-slate-400 text-[40px]">construction</span>
          </div>
          <h3 className="text-xl font-bold text-anthracite mb-2">Fonctionnalité à venir</h3>
          <p className="text-slate-400 text-sm max-w-md mb-6">
            La gestion de projets internes sera disponible dans une prochaine version de Maono Ops.
          </p>
          <Link
            href="/projects"
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Retour aux projets
          </Link>
        </div>
      </main>
    </div>
  );
}
