import { KpiCard } from "@/components/ui/KpiCard";
import { KanbanCard } from "@/components/editorial/KanbanCard";
import { KanbanColumn } from "@/components/editorial/KanbanColumn";
import { SidePanel } from "@/components/editorial/SidePanel";

// ── Static mock data (will be replaced with real DB queries) ──

const MILESTONES = [
  {
    title: "Global Summit Brief",
    subtitle: "Due in 3 days",
    icon: "event",
    iconBg: "bg-editorial/10",
    iconColor: "text-editorial",
  },
  {
    title: "White Paper: Cloud ERP",
    subtitle: "Review required",
    icon: "description",
    iconBg: "bg-pastel-cream",
    iconColor: "text-amber-600",
  },
  {
    title: "Q4 Product Launch Post",
    subtitle: "Due in 7 days",
    icon: "rocket_launch",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
];

const HEALTH_METRICS = [
  { label: "Consistency",     value: 85, color: "bg-editorial" },
  { label: "Brand Alignment", value: 94, color: "bg-emerald-400" },
  { label: "On-time Delivery",value: 78, color: "bg-amber-400"  },
];

const BACKLOG_CARDS = [
  {
    id: "1",
    title: 'Q4 Product Vision: The "White Canvas" Experience',
    type: "INTERNAL",
    date: "Oct 12",
    members: [{ initials: "SJ", color: "#94a3b8" }],
  },
  {
    id: "2",
    title: "Optimizing Partner Portals for Speed",
    type: "ECOSYSTEM",
    commentCount: 4,
    members: [{ initials: "MJ", color: "#64748b" }],
    extraMembers: 2,
  },
  {
    id: "3",
    title: "Introducing New Odoo Mobile App",
    type: "CORPORATE",
    date: "Oct 20",
    members: [{ initials: "AL", color: "#475569" }],
  },
];

const PRODUCTION_CARDS = [
  {
    id: "4",
    title: "Sustainability Report 2024: Digital First",
    type: "CORPORATE",
    statusLabel: "IN REVIEW",
    statusIcon: "autorenew",
    statusColor: "text-editorial",
    members: [{ initials: "PD", color: "#3b82f6" }],
  },
  {
    id: "5",
    title: "Odoo 17 Feature Breakdown for SMEs",
    type: "MARKET",
    statusLabel: "IN REVIEW",
    statusIcon: "autorenew",
    statusColor: "text-editorial",
    members: [{ initials: "CR", color: "#6366f1" }],
  },
];

const DISTRIBUTION_CARDS = [
  {
    id: "6",
    title: "Case Study: Transforming Retail with Odoo POS",
    type: "EXTERNAL",
    statusLabel: "QUEUED",
    statusIcon: "rocket_launch",
    statusColor: "text-amber-600",
    members: [{ initials: "HB", color: "#f59e0b" }],
  },
  {
    id: "7",
    title: "Global SME Trends in Manufacturing 2024",
    type: "MARKET",
    commentCount: 2,
    members: [
      { initials: "SJ", color: "#94a3b8" },
      { initials: "MJ", color: "#64748b" },
    ],
  },
];

const LIVE_CARDS = [
  {
    id: "8",
    title: "Introducing Odoo 17 Feature Set",
    date: "Sep 28, 2023",
  },
  {
    id: "9",
    title: "The Future of ERP: Odoo Community Summit",
    date: "Sep 15, 2023",
  },
];

export default function StrategyPage() {
  return (
    <div className="flex-1 min-h-screen xl:pr-72">
      <main className="px-8 py-8 max-w-[1280px] mx-auto">

        {/* ── Page header ── */}
        <div className="mb-10">
          <h2 className="text-anthracite text-2xl font-bold mb-1">Strategic Overview</h2>
          <p className="text-slate-400 text-sm">Editorial performance and upcoming content pipelines</p>
        </div>

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          <KpiCard
            label="Total Reach"
            value="1.2M"
            delta="+14.2%"
            deltaPositive
            subtext="vs last month"
            icon="trending_up"
            featured
          />
          <KpiCard
            label="Active Projects"
            value={24}
            subtext="8 starting this week"
            icon="folder_open"
          />
          <KpiCard
            label="Editorial ROI"
            value="4.8x"
            delta="+0.3"
            deltaPositive
            subtext="efficiency index"
            icon="payments"
            featured
          />
          <KpiCard
            label="Draft Consistency"
            value="92%"
            icon="rule"
            progress={92}
          />
        </div>

        {/* ── Kanban board ── */}
        <div className="flex gap-5 overflow-x-auto pb-4">

          {/* Column 1 — Ideation & Backlog */}
          <KanbanColumn
            title="Ideation & Backlog"
            count={12}
            dotColor="bg-slate-400"
            countColor="text-slate-500"
            bg="bg-pastel-grey"
            showAddButton
          >
            {BACKLOG_CARDS.map((card) => (
              <KanbanCard key={card.id} {...card} />
            ))}
          </KanbanColumn>

          {/* Column 2 — Strategic Production */}
          <KanbanColumn
            title="Strategic Production"
            count={5}
            dotColor="bg-editorial"
            countColor="text-editorial"
            bg="bg-pastel-blue"
          >
            {PRODUCTION_CARDS.map((card) => (
              <KanbanCard key={card.id} borderHover="hover:border-editorial" {...card} />
            ))}
          </KanbanColumn>

          {/* Column 3 — Client Distribution */}
          <KanbanColumn
            title="Client Distribution"
            count={8}
            dotColor="bg-amber-400"
            countColor="text-amber-600"
            bg="bg-pastel-cream"
          >
            {DISTRIBUTION_CARDS.map((card) => (
              <KanbanCard key={card.id} borderHover="hover:border-amber-400/30" {...card} />
            ))}
          </KanbanColumn>

          {/* Column 4 — Live Content */}
          <KanbanColumn
            title="Live Content"
            count={42}
            dotColor="bg-green-500"
            countColor="text-slate-400"
            bg="bg-slate-50"
            borderStyle="border border-dashed border-slate-200"
            dimContent
          >
            {LIVE_CARDS.map((card) => (
              <div key={card.id} className="bg-white p-4 rounded-lg shadow-soft border border-slate-100">
                <h4 className="text-anthracite font-medium text-sm leading-snug mb-1">{card.title}</h4>
                <p className="text-2xs text-slate-400">Published: {card.date}</p>
              </div>
            ))}
          </KanbanColumn>
        </div>
      </main>

      {/* ── Fixed right panel ── */}
      <SidePanel milestones={MILESTONES} healthMetrics={HEALTH_METRICS} />
    </div>
  );
}
