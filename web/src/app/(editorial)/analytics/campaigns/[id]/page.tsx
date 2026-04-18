import Link from "next/link";

const CAMPAIGN = {
  id:"c1", name:"Q4 Product Launch", client:"Odoo SA", status:"ACTIVE",
  start:"Oct 1, 2024", end:"Dec 31, 2024",
  kpis:     { reach:1200000, engagement:5,   ctr:2.5, conversions:300 },
  actuals:  { reach:820000,  engagement:4.2, ctr:1.8, conversions:187 },
};

// Weekly data for the chart (last 8 weeks)
const WEEKLY = [
  { week:"S1 Oct", reach:45000, engagement:3.8, ctr:1.4 },
  { week:"S2 Oct", reach:72000, engagement:4.1, ctr:1.7 },
  { week:"S3 Oct", reach:88000, engagement:4.5, ctr:2.0 },
  { week:"S4 Oct", reach:110000,engagement:4.8, ctr:2.1 },
  { week:"S1 Nov", reach:98000, engagement:4.2, ctr:1.9 },
  { week:"S2 Nov", reach:125000,engagement:4.6, ctr:2.3 },
  { week:"S3 Nov", reach:142000,engagement:4.9, ctr:2.4 },
  { week:"S4 Nov", reach:140000,engagement:4.2, ctr:1.8 },
];

const TOP_CONTENTS = [
  { title:"Q4 teaser reel",         platform:"INSTAGRAM", reach:180000, engagement:6.2, published:"Oct 3"  },
  { title:"Odoo 17 walkthrough",    platform:"YOUTUBE",   reach:95000,  engagement:8.4, published:"Oct 18" },
  { title:"Partner tips carousel",  platform:"INSTAGRAM", reach:78000,  engagement:5.9, published:"Oct 22" },
  { title:"Cloud ERP article",      platform:"LINKEDIN",  reach:52000,  engagement:3.1, published:"Apr 15" },
];

const PLATFORM_BREAKDOWN = [
  { name:"Instagram", reach:380000, engagement:5.4, ctr:2.2, posts:6, color:"bg-pink-500"  },
  { name:"LinkedIn",  reach:290000, engagement:3.8, ctr:1.9, posts:4, color:"bg-blue-600"  },
  { name:"YouTube",   reach:150000, engagement:7.2, ctr:1.2, posts:2, color:"bg-red-500"   },
];

const maxReach = Math.max(...WEEKLY.map(w => w.reach));
const BAR_MAX_PX = 110;

export default function CampaignAnalyticsPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex-1 min-h-screen">
      <main className="px-8 py-8 max-w-[1400px] mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <Link href="/analytics" className="hover:text-anthracite transition-colors">Analytics</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <Link href={`/campaigns/${params.id}`} className="hover:text-anthracite transition-colors">{CAMPAIGN.name}</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-anthracite font-medium">Performance</span>
        </div>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-anthracite">{CAMPAIGN.name}</h1>
              <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full">Actif</span>
            </div>
            <p className="text-sm text-slate-400">{CAMPAIGN.client} · {CAMPAIGN.start} → {CAMPAIGN.end}</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 h-9 px-4 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">
              <span className="material-symbols-outlined text-[16px]">download</span>Exporter CSV
            </button>
            <Link href={`/campaigns/${params.id}`} className="flex items-center gap-2 h-9 px-4 bg-editorial text-white rounded-lg text-sm font-semibold hover:bg-editorial/90 shadow-sm">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>Vue campagne
            </Link>
          </div>
        </div>

        {/* KPI progress bars */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label:"Reach",       actual:CAMPAIGN.actuals.reach,       target:CAMPAIGN.kpis.reach,       fmt:(v:number)=>v>=1000000?`${(v/1000000).toFixed(1)}M`:`${(v/1000).toFixed(0)}k`, unit:"" },
            { label:"Engagement",  actual:CAMPAIGN.actuals.engagement,  target:CAMPAIGN.kpis.engagement,  fmt:(v:number)=>`${v}`,                                                               unit:"%" },
            { label:"CTR",         actual:CAMPAIGN.actuals.ctr,         target:CAMPAIGN.kpis.ctr,         fmt:(v:number)=>`${v}`,                                                               unit:"%" },
            { label:"Conversions", actual:CAMPAIGN.actuals.conversions, target:CAMPAIGN.kpis.conversions, fmt:(v:number)=>String(v),                                                            unit:" leads" },
          ].map(({ label, actual, target, fmt, unit }) => {
            const pct = Math.min(100, Math.round((actual / target) * 100));
            return (
              <div key={label} className="bg-white rounded-xl border border-slate-100 shadow-soft p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
                <p className="text-2xl font-bold text-anthracite mb-0.5">{fmt(actual)}{unit}</p>
                <p className="text-2xs text-slate-400 mb-3">Objectif: {fmt(target)}{unit}</p>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className={`h-2 rounded-full ${pct >= 80 ? "bg-emerald-400" : pct >= 50 ? "bg-editorial" : "bg-amber-400"}`} style={{ width:`${pct}%` }} />
                </div>
                <p className="text-2xs text-slate-400 mt-1">{pct}% de l'objectif</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Weekly reach chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-soft p-6">
            <h3 className="text-sm font-bold text-anthracite mb-5">Reach hebdomadaire</h3>
            <div className="flex items-end gap-2" style={{ height: "160px" }}>
              {WEEKLY.map((w, i) => {
                const barH = Math.round((w.reach / maxReach) * BAR_MAX_PX);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group relative">
                    <div className="absolute left-1/2 -translate-x-1/2 bg-anthracite text-white text-2xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none" style={{ bottom: `${barH + 28}px` }}>
                      {(w.reach/1000).toFixed(0)}k · {w.engagement}%
                    </div>
                    <div
                      className="w-full rounded-t-sm bg-editorial/30 group-hover:bg-editorial/60 transition-colors"
                      style={{ height:`${barH}px` }}
                    />
                    <span className="text-2xs text-slate-400 text-center leading-tight">{w.week}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Platform breakdown */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-6">
            <h3 className="text-sm font-bold text-anthracite mb-5">Par plateforme</h3>
            <div className="space-y-4">
              {PLATFORM_BREAKDOWN.map(p => {
                const total = PLATFORM_BREAKDOWN.reduce((s, pl) => s + pl.reach, 0);
                const pct = Math.round((p.reach / total) * 100);
                return (
                  <div key={p.name}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${p.color}`} />
                        <span className="text-xs font-semibold text-anthracite">{p.name}</span>
                      </div>
                      <span className="text-xs font-bold text-anthracite">{(p.reach/1000).toFixed(0)}k</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={`h-2 rounded-full ${p.color} opacity-80`} style={{ width:`${pct}%` }} />
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-2xs text-slate-400">{p.posts} posts · {p.engagement}% eng.</span>
                      <span className="text-2xs text-slate-400">{p.ctr}% CTR</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top performing content */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-soft overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-anthracite">Top contenus</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                {["Contenu","Plateforme","Reach","Engagement","Publié",""].map(h => (
                  <th key={h} className="px-5 py-3 text-2xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {TOP_CONTENTS.map((ct, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold ${i === 0 ? "text-amber-500" : "text-slate-300"}`}>{i + 1}</span>
                      <span className="text-sm font-medium text-anthracite">{ct.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">{ct.platform}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-anthracite">
                    {ct.reach >= 1000000 ? `${(ct.reach/1000000).toFixed(1)}M` : `${(ct.reach/1000).toFixed(0)}k`}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-sm font-semibold ${ct.engagement >= 6 ? "text-emerald-600" : ct.engagement >= 4 ? "text-editorial" : "text-amber-600"}`}>
                      {ct.engagement}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">{ct.published}</td>
                  <td className="px-5 py-3.5">
                    <Link href={`/contents/${i+1}`} className="text-editorial text-xs font-semibold hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                      Voir →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
