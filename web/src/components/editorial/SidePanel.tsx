interface Milestone {
  title: string;
  subtitle: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

interface HealthMetric {
  label: string;
  value: number;
  color: string;
}

interface SidePanelProps {
  milestones: Milestone[];
  healthMetrics: HealthMetric[];
}

export function SidePanel({ milestones, healthMetrics }: SidePanelProps) {
  return (
    <aside className="hidden xl:block fixed right-0 top-16 bottom-0 w-72 bg-white border-l border-slate-100 p-6 overflow-y-auto">
      {/* Upcoming Milestones */}
      <h5 className="text-anthracite font-bold text-sm mb-5">Upcoming Milestones</h5>
      <div className="space-y-5">
        {milestones.map((m, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${m.iconBg} flex items-center justify-center ${m.iconColor}`}>
              <span className="material-symbols-outlined text-[20px]">{m.icon}</span>
            </div>
            <div>
              <p className="text-xs font-bold text-anthracite">{m.title}</p>
              <p className="text-2xs text-slate-400 mt-0.5">{m.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Strategic Health */}
      <div className="mt-10 pt-7 border-t border-slate-100">
        <h5 className="text-anthracite font-bold text-sm mb-4">Strategic Health</h5>
        <div className="space-y-4">
          {healthMetrics.map((m, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-2xs font-medium text-slate-500">
                <span>{m.label}</span>
                <span>{m.value}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                <div className={`${m.color} h-full rounded-full`} style={{ width: `${m.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
