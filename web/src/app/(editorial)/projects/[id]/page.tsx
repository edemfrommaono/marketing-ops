import Link from "next/link";
import { WorkstreamCard } from "@/components/projects/WorkstreamCard";
import { ProjectTimeline } from "@/components/projects/ProjectTimeline";
import { RiskBadge } from "@/components/ui/StatusBadge";
import { RiskLevel } from "@prisma/client";

// ── Mock data ──
const PROJECT = {
  id: "proj-1",
  title: "Studio Expansion Project",
  subtitle: "Strategic overhaul of the creative workspace to increase capacity by 40%.",
  budget: { spent: 450000, total: 500000 },
  timelinePercent: 65,
  teamCount: 12,
  weekLabel: "Week 12 of 24",
};
const PHASES = [
  { label:"Planning",     done:true  },
  { label:"Design",       done:true  },
  { label:"Procurement",  done:true  },
  { label:"Construction", done:false, current:true },
  { label:"Launch",       done:false },
];
const WORKSTREAMS = [
  { title:"Studio Architecture", description:"Layout design and structural changes.", icon:"architecture", progress:85, status:"On Track" as const, members:[{initials:"SJ",color:"#94a3b8"},{initials:"MJ",color:"#64748b"}], extraMembers:2 },
  { title:"Labs Integration",    description:"Sound testing and equipment calibration.", icon:"science",      progress:45, status:"At Risk"  as const, members:[{initials:"CR",color:"#f59e0b"}], extraMembers:1 },
  { title:"Systems Upgrade",     description:"Network infrastructure overhaul.",         icon:"dns",          progress:60, status:"On Track" as const, members:[{initials:"AL",color:"#3b82f6"}] },
  { title:"Operational Strategy",description:"Workflow optimization planning.",           icon:"strategy",     progress:15, status:"Pending"  as const, members:[{initials:"HB",color:"#8b5cf6"},{initials:"PD",color:"#ec4899"}] },
];
const DELIVERABLES = [
  { id:"d1", title:"Acoustic Analysis Report",  dueDate:"Oct 12", team:"Labs Team",     icon:"description" },
  { id:"d2", title:"Final Floor Plan Approval", dueDate:"Oct 15", team:"Architecture",  icon:"floor"       },
  { id:"d3", title:"Network Hardware Procurement",dueDate:"Oct 18",team:"Systems",       icon:"router"      },
];
const RISKS = [
  { id:"r1", level:"HIGH" as RiskLevel,   title:"Equipment Shipment Delay",   description:"Vendor reported a 2-week delay on acoustic panels due to supply chain.", age:"2d ago", action:"View Mitigation Plan" },
  { id:"r2", level:"MEDIUM" as RiskLevel, title:"Budget Variance",            description:"Electrical wiring costs exceeding initial estimates by 12%.",             age:"5d ago", action:"Review Budget" },
];
const ACTIVITY = [
  { actor:"Sarah Jenkins", verb:"uploaded 3 files to",  subject:"Studio Architecture", time:"2 hours ago",  initials:"SJ", color:"#94a3b8"  },
  { actor:"Michael Jordan", verb:"marked",               subject:"Systems Upgrade as 60% complete",  time:"5 hours ago",  initials:"MJ", color:"#64748b"  },
  { actor:"System",         verb:"flagged a new budget risk", subject:"",               time:"Yesterday",    initials:null, icon:"warning"   },
];

export default function ProjectOverviewPage() {
  const budgetPct = Math.round((PROJECT.budget.spent / PROJECT.budget.total) * 100);

  return (
    <div className="flex-1 min-h-screen bg-white">
      <main className="px-6 md:px-10 py-8 max-w-[1440px] mx-auto">

        {/* ── Breadcrumbs + title ── */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <Link href="/"        className="hover:text-primary transition-colors">Home</Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <Link href="/projects" className="hover:text-primary transition-colors">Projects</Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-primary font-medium">Studio Expansion</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-primary tracking-tight">{PROJECT.title}</h1>
            <p className="text-slate-500 text-base max-w-2xl mt-1">{PROJECT.subtitle}</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 h-10 px-4 bg-white border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-[18px]">share</span>
              Share
            </button>
            <button className="flex items-center gap-2 h-10 px-4 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-black/90 transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit Project
            </button>
          </div>
        </div>

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="p-5 rounded-xl border border-slate-100 bg-white shadow-card flex flex-col justify-between h-32">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Budget</p>
              <span className="material-symbols-outlined text-slate-400">attach_money</span>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">${(PROJECT.budget.spent/1000).toFixed(0)}k</p>
              <div className="mt-1">
                <div className="flex justify-between text-2xs text-slate-400 mb-0.5">
                  <span>of ${PROJECT.budget.total/1000}k allocated</span>
                  <span>{budgetPct}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full">
                  <div className={`h-1 rounded-full ${budgetPct > 90 ? "bg-red-500" : "bg-primary"}`} style={{width:`${budgetPct}%`}} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-100 bg-white shadow-card flex flex-col justify-between h-32">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Timeline</p>
              <span className="material-symbols-outlined text-slate-400">schedule</span>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{PROJECT.timelinePercent}%</p>
              <p className="text-xs text-slate-400 mt-1">On track for Q4 launch</p>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-100 bg-white shadow-card flex flex-col justify-between h-32">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Team</p>
              <span className="material-symbols-outlined text-slate-400">group</span>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{PROJECT.teamCount}</p>
              <p className="text-xs text-slate-400 mt-1">Active members</p>
            </div>
          </div>

          {/* Risk card — cream accent */}
          <div className="p-5 rounded-xl border border-primary-accent bg-primary-accent shadow-card flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="flex items-center justify-between z-10 relative">
              <p className="text-primary text-xs font-bold uppercase tracking-wider">Risks</p>
              <span className="material-symbols-outlined text-primary">warning</span>
            </div>
            <div className="z-10 relative">
              <p className="text-3xl font-bold text-primary">{RISKS.length}</p>
              <p className="text-xs text-primary/70 mt-1 font-medium">Requires immediate attention</p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <span className="material-symbols-outlined text-[120px]">warning</span>
            </div>
          </div>
        </div>

        {/* ── Project Timeline ── */}
        <ProjectTimeline
          phases={PHASES}
          progressPercent={PROJECT.timelinePercent}
          weekLabel={PROJECT.weekLabel}
        />

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left — Workstreams + Deliverables */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {/* Workstreams */}
            <section>
              <h3 className="text-lg font-bold text-primary mb-5">Active Workstreams</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {WORKSTREAMS.map((w) => <WorkstreamCard key={w.title} {...w} />)}
              </div>
            </section>

            {/* Deliverables */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-primary">Upcoming Deliverables</h3>
                <a href="#" className="text-sm font-semibold text-primary hover:underline">View All</a>
              </div>
              <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
                {DELIVERABLES.map((d, idx) => (
                  <div key={d.id} className={`group flex items-center justify-between p-4 hover:bg-slate-50 transition-colors ${idx < DELIVERABLES.length-1 ? "border-b border-slate-50" : ""}`}>
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">{d.icon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">{d.title}</p>
                        <p className="text-xs text-slate-500">Due {d.dueDate} • Assigned to {d.team}</p>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-primary p-2">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right — Risk management + Activity */}
          <div className="flex flex-col gap-8">

            {/* Risk Management */}
            <div className="bg-primary-accent rounded-xl p-6 border border-[#ffeebf] relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary rounded-lg text-white inline-flex">
                    <span className="material-symbols-outlined">warning</span>
                  </div>
                  <h3 className="text-lg font-bold text-primary">Risk Management</h3>
                </div>

                <div className="space-y-4">
                  {RISKS.map((r) => (
                    <div key={r.id} className="bg-white/60 p-4 rounded-lg border border-orange-100 backdrop-blur-sm">
                      <div className="flex justify-between items-start mb-2">
                        <RiskBadge level={r.level} />
                        <span className="text-xs text-slate-500">{r.age}</span>
                      </div>
                      <p className="text-sm font-bold text-primary leading-tight mb-1">{r.title}</p>
                      <p className="text-xs text-slate-600">{r.description}</p>
                      <button className="mt-3 text-xs font-semibold text-primary underline decoration-slate-300 underline-offset-4 hover:decoration-primary transition-all">
                        {r.action}
                      </button>
                    </div>
                  ))}
                </div>

                <button className="w-full mt-6 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-black/90 transition-colors shadow-sm">
                  Report New Risk
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white border border-slate-100 rounded-xl p-6">
              <h3 className="text-base font-bold text-primary mb-4">Recent Activity</h3>
              <div className="space-y-5 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                {ACTIVITY.map((a, i) => (
                  <div key={i} className="relative pl-9">
                    <div className={`absolute left-0 top-0 size-8 rounded-full border-2 border-white flex items-center justify-center overflow-hidden text-2xs font-bold text-white`}
                         style={{ backgroundColor: a.color ?? "#111418" }}>
                      {a.icon
                        ? <span className="material-symbols-outlined text-[14px]">{a.icon}</span>
                        : a.initials}
                    </div>
                    <p className="text-sm text-primary font-medium">
                      <span className="font-semibold">{a.actor}</span>{" "}
                      <span className="text-slate-500 font-normal">{a.verb}</span>{" "}
                      {a.subject && <span className="font-medium">{a.subject}</span>}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{a.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
