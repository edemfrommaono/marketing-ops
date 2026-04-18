import { RiskLevel } from "@prisma/client";

const INCIDENTS = [
  { id:"INC-2094", level:"CRITICAL", title:"Payment Gateway Latency", description:"High latency detected in `eu-west-1`. Engineering team is investigating potential database lock issues.", age:"14m ago", assignees:["SJ","MJ"], resolved:false },
  { id:"INC-2092", level:"WARNING",  title:"Cache Miss Rate Spike",   description:"Redis cluster node 4 experiencing higher than normal eviction rates. Monitoring.", age:"2h ago",  assignees:["CR"], resolved:false },
  { id:"INC-2088", level:"RESOLVED", title:"Auth Service Degradation", description:"Fixed JWT validation timeout. Service restored to 100%.", age:"Yesterday", assignees:[], resolved:true },
];
const RELEASES = [
  { time:"Coming Up (14:00)", label:"v2.4.0 Deployment",    note:"Core banking module update. Scheduled maintenance window.", commit:null,      current:true },
  { time:"11:30 AM",          label:"Hotfix 2.3.9",         note:"Patched security vulnerability in user session handling.", commit:"8f3a2c", current:false },
  { time:"Yesterday",         label:"Frontend Asset Bundle", note:"Performance optimization for dashboard load times.",       commit:null,      current:false },
];
const INCIDENT_STYLES: Record<string,{badge:string;icon:string}> = {
  CRITICAL: { badge:"bg-primary-accent text-black border border-orange-200", icon:"error"         },
  WARNING:  { badge:"bg-slate-100 text-slate-700 border border-slate-200",   icon:"warning"       },
  RESOLVED: { badge:"bg-green-50 text-green-700 border border-green-200",    icon:"check_circle"  },
};
const AVATAR_COLORS = ["#94a3b8","#64748b","#475569","#3b82f6"];

export default function SystemsMonitorPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-primary sm:text-4xl">Systems Monitor</h2>
          <p className="mt-1 text-base text-slate-500">Real-time performance, incidents, and infrastructure topology.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            Last 24 Hours
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-black/90">
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Refresh Data
          </button>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-12 gap-6">

        {/* ── Left column — charts ── */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">

          {/* API Latency */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">API Latency (Global)</h3>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight text-primary">42ms</span>
                  <span className="flex items-center text-sm font-medium text-green-600">
                    <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                    5% vs avg
                  </span>
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <span className="material-symbols-outlined text-slate-400">speed</span>
              </div>
            </div>
            {/* SVG line chart */}
            <div className="relative h-40 w-full">
              <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 50">
                <line stroke="#f1f5f9" strokeWidth="0.5" x1="0" x2="100" y1="0"  y2="0"  />
                <line stroke="#f1f5f9" strokeWidth="0.5" x1="0" x2="100" y1="12" y2="12" />
                <line stroke="#f1f5f9" strokeWidth="0.5" x1="0" x2="100" y1="25" y2="25" />
                <line stroke="#f1f5f9" strokeWidth="0.5" x1="0" x2="100" y1="37" y2="37" />
                <line stroke="#e2e8f0" strokeWidth="0.5" x1="0" x2="100" y1="50" y2="50" />
                <path d="M0 35 Q 10 32, 20 38 T 40 30 T 60 25 T 80 28 T 100 20" fill="none" stroke="#000" strokeWidth="1.5" />
                <path d="M0 35 Q 10 32, 20 38 T 40 30 T 60 25 T 80 28 T 100 20 V 50 H 0 Z" fill="rgba(0,0,0,0.04)" />
              </svg>
              <div className="mt-2 flex justify-between text-xs text-slate-400">
                {["00:00","04:00","08:00","12:00","16:00","20:00"].map(t=>(
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Uptime */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Uptime & Availability</h3>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight text-primary">99.99%</span>
                  <span className="flex items-center text-sm font-medium text-green-600">
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    Optimal
                  </span>
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <span className="material-symbols-outlined text-slate-400">dns</span>
              </div>
            </div>
            {/* Bar chart */}
            <div className="relative h-28 w-full">
              <div className="flex h-full items-end gap-[2px]">
                {[80,85,90,88,92,95,94,96,98,99,95,92,90,94,96,98,40,90,92,95,100].map((h,i) => (
                  <div key={i}
                    className={`w-full rounded-sm transition-all ${h===40 ? "bg-primary-accent hover:bg-yellow-300" : "bg-primary/10 hover:bg-primary"}`}
                    style={{ height:`${h}%` }}
                    title={h===40?"Incident":"Nominal"}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>30 Days Ago</span><span>Today</span>
              </div>
            </div>
          </div>

          {/* Release Timeline + Topology */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Release Timeline */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
              <h3 className="mb-6 text-lg font-bold text-primary">Release Timeline</h3>
              <div className="relative pl-4">
                <div className="absolute left-[23px] top-2 h-full w-px bg-slate-200" />
                <div className="flex flex-col gap-7">
                  {RELEASES.map((r, i) => (
                    <div key={i} className="relative flex gap-5">
                      <div className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white ring-4 ring-slate-100">
                        <div className={`h-2 w-2 rounded-full ${r.current ? "bg-primary" : "bg-slate-400"}`} />
                      </div>
                      <div>
                        <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">{r.time}</span>
                        <h4 className="text-sm font-bold text-primary">{r.label}</h4>
                        <p className="text-xs text-slate-500">{r.note}</p>
                        {r.commit && (
                          <div className="mt-1 inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-2xs font-medium text-slate-600">
                            <span className="material-symbols-outlined text-[12px]">code</span>
                            commit: {r.commit}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* System Topology */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-primary">System Topology</h3>
                <button className="text-xs font-medium text-primary hover:underline">View Full Map</button>
              </div>
              <div className="relative flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 min-h-[240px]">
                {/* Gateway center */}
                <div className="relative z-10 flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 border-primary bg-white shadow-lg">
                  <span className="material-symbols-outlined text-primary text-[18px]">hub</span>
                  <span className="text-2xs font-bold text-primary">Gateway</span>
                </div>
                {/* Lines */}
                <svg className="absolute inset-0 h-full w-full pointer-events-none">
                  <line stroke="#cbd5e1" strokeDasharray="4" strokeWidth="1" x1="50%" x2="20%" y1="50%" y2="25%" />
                  <line stroke="#cbd5e1" strokeWidth="1" x1="50%" x2="80%" y1="50%" y2="25%" />
                  <line stroke="#cbd5e1" strokeWidth="1" x1="50%" x2="50%" y1="50%" y2="80%" />
                </svg>
                {/* Nodes */}
                {[
                  { label:"Primary DB", icon:"database",   pos:"left-[12%] top-[15%]", dot:"bg-green-500" },
                  { label:"CDN Edge",   icon:"cloud_queue", pos:"right-[12%] top-[15%]",dot:"bg-green-500" },
                  { label:"Auth Svc",   icon:"lock",        pos:"bottom-[10%] left-1/2 -translate-x-1/2", dot:"bg-primary-accent animate-pulse" },
                ].map(n => (
                  <div key={n.label} className={`absolute ${n.pos} flex flex-col items-center gap-1`}>
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
                        <span className="material-symbols-outlined text-slate-500 text-[18px]">{n.icon}</span>
                      </div>
                      <span className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white ${n.dot}`} />
                    </div>
                    <span className="text-2xs font-medium text-slate-500 bg-white px-1 rounded">{n.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right column — Incidents ── */}
        <div className="col-span-12 lg:col-span-4">
          <div className="h-full rounded-xl border border-slate-200 bg-white shadow-card overflow-hidden flex flex-col">
            <div className="border-b border-slate-100 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-primary">Active Incidents</h3>
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                  {INCIDENTS.filter(i=>!i.resolved).length} Active
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {INCIDENTS.map((inc) => {
                const s = INCIDENT_STYLES[inc.level];
                return (
                  <div key={inc.id} className={`p-5 hover:bg-slate-50 transition-colors ${inc.resolved ? "opacity-60 hover:opacity-100" : ""}`}>
                    <div className="mb-3 flex items-start justify-between">
                      <span className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-2xs font-bold ${s.badge}`}>
                        <span className="material-symbols-outlined text-[14px]">{s.icon}</span>
                        {inc.level}
                      </span>
                      <span className="text-2xs font-medium text-slate-500">{inc.age}</span>
                    </div>
                    <h4 className="mb-1 text-sm font-bold text-primary">{inc.title}</h4>
                    <p className="text-xs leading-relaxed text-slate-600">{inc.description}</p>
                    {inc.assignees.length > 0 && (
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {inc.assignees.map((a,i) => (
                            <div key={i} className="h-5 w-5 rounded-full border-2 border-white flex items-center justify-center text-2xs font-bold text-white"
                                 style={{backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length]}}>
                              {a}
                            </div>
                          ))}
                        </div>
                        <span className="text-xs font-medium text-slate-500">#{inc.id}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
