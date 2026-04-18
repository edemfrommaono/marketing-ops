import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Projets" };

// ── Mock data consistent with the detail page mock ──
const PROJECTS = [
  {
    id: "proj-1",
    title: "Studio Expansion Project",
    subtitle: "Overhaul of the creative workspace to increase capacity by 40%.",
    status: "In Progress",
    statusStyle: "bg-editorial/10 text-editorial",
    timelinePercent: 65,
    weekLabel: "Week 12 of 24",
    teamCount: 12,
    budget: { spent: 450000, total: 500000 },
    risks: 2,
  },
  {
    id: "proj-2",
    title: "Brand Identity Refresh",
    subtitle: "Full visual identity overhaul — logo, typography, color system, brand guidelines.",
    status: "Planning",
    statusStyle: "bg-slate-100 text-slate-600",
    timelinePercent: 18,
    weekLabel: "Week 3 of 16",
    teamCount: 6,
    budget: { spent: 40000, total: 120000 },
    risks: 0,
  },
  {
    id: "proj-3",
    title: "Q3 Campaign Production",
    subtitle: "Multi-platform content production sprint for the Q3 product launch.",
    status: "At Risk",
    statusStyle: "bg-amber-50 text-amber-700",
    timelinePercent: 82,
    weekLabel: "Week 10 of 12",
    teamCount: 9,
    budget: { spent: 88000, total: 90000 },
    risks: 3,
  },
  {
    id: "proj-4",
    title: "Podcast Launch",
    subtitle: "End-to-end production of a branded podcast series — 8 episodes.",
    status: "Completed",
    statusStyle: "bg-emerald-50 text-emerald-700",
    timelinePercent: 100,
    weekLabel: "Week 20 of 20",
    teamCount: 5,
    budget: { spent: 34000, total: 35000 },
    risks: 0,
  },
];

export default function ProjectsPage() {
  return (
    <div className="flex-1 min-h-screen bg-white">
      <main className="px-6 md:px-10 py-8 max-w-[1440px] mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-primary font-medium">Projects</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-primary tracking-tight">Projects</h1>
            <p className="text-slate-500 text-base mt-1">Track all active and upcoming production projects.</p>
          </div>
          <button className="flex items-center gap-2 h-10 px-4 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-black/90 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Project
          </button>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total", value: String(PROJECTS.length),          icon: "folder_open",   accent: "text-primary" },
            { label: "Active", value: String(PROJECTS.filter(p => p.status === "In Progress").length), icon: "play_circle", accent: "text-editorial" },
            { label: "At Risk", value: String(PROJECTS.filter(p => p.status === "At Risk").length),  icon: "warning",      accent: "text-amber-500" },
            { label: "Completed", value: String(PROJECTS.filter(p => p.status === "Completed").length), icon: "check_circle", accent: "text-emerald-600" },
          ].map(({ label, value, icon, accent }) => (
            <div key={label} className="p-5 rounded-xl border border-slate-100 bg-white shadow-card flex flex-col gap-2">
              <span className={`material-symbols-outlined text-[22px] ${accent}`}>{icon}</span>
              <p className={`text-3xl font-bold ${accent}`}>{value}</p>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {/* Project cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
          {PROJECTS.map((project) => {
            const budgetPct = Math.round((project.budget.spent / project.budget.total) * 100);
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group block bg-white border border-slate-100 rounded-xl shadow-soft hover:shadow-card hover:border-slate-200 transition-all duration-200"
              >
                <div className="p-6">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-bold text-primary group-hover:text-editorial transition-colors truncate">
                        {project.title}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {project.subtitle}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 text-2xs font-bold px-2.5 py-1 rounded-full ${project.statusStyle}`}>
                      {project.status}
                    </span>
                  </div>

                  {/* Timeline progress */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center text-2xs text-slate-400 mb-1">
                      <span>{project.weekLabel}</span>
                      <span className="font-semibold text-primary">{project.timelinePercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          project.timelinePercent === 100
                            ? "bg-emerald-500"
                            : project.status === "At Risk"
                            ? "bg-amber-400"
                            : "bg-editorial"
                        }`}
                        style={{ width: `${project.timelinePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer row */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-slate-400">group</span>
                        <span>{project.teamCount} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-slate-400">attach_money</span>
                        <span>
                          ${(project.budget.spent / 1000).toFixed(0)}k
                          <span className="text-slate-400"> / ${(project.budget.total / 1000).toFixed(0)}k</span>
                          <span className="ml-1 font-semibold text-primary">({budgetPct}%)</span>
                        </span>
                      </div>
                    </div>
                    {project.risks > 0 && (
                      <div className="flex items-center gap-1 text-amber-600 text-2xs font-bold">
                        <span className="material-symbols-outlined text-[14px]">warning</span>
                        {project.risks} risk{project.risks > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
