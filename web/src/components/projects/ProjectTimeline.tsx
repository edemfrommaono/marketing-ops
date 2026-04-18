interface Phase {
  label: string;
  done: boolean;
  current?: boolean;
}

interface ProjectTimelineProps {
  phases: Phase[];
  progressPercent: number;
  weekLabel: string;
}

export function ProjectTimeline({ phases, progressPercent, weekLabel }: ProjectTimelineProps) {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-primary">Project Timeline</h3>
        <span className="text-sm text-slate-500">{weekLabel}</span>
      </div>
      <div className="relative w-full h-16 bg-slate-50 rounded-xl flex items-center px-6 border border-slate-100 overflow-hidden">
        {/* Progress fill */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-primary/5 rounded-l-xl"
          style={{ width: `${progressPercent}%` }}
        />
        {/* Steps */}
        <div className="relative w-full flex justify-between items-center z-10">
          {phases.map((phase, idx) => {
            const isLast = idx === phases.length - 1;
            return (
              <div key={phase.label} className="contents">
                <div className="flex flex-col items-center gap-2 cursor-pointer group">
                  <div className={`size-3 rounded-full
                    ${phase.done    ? "bg-primary ring-4 ring-primary/10" : ""}
                    ${phase.current ? "bg-white border-2 border-primary"  : ""}
                    ${!phase.done && !phase.current ? "bg-slate-300" : ""}
                  `} />
                  <span className={`text-xs font-${phase.done ? "semibold" : "medium"} ${phase.done ? "text-primary" : phase.current ? "text-slate-500" : "text-slate-400"} group-hover:text-primary transition-colors whitespace-nowrap`}>
                    {phase.label}
                  </span>
                </div>
                {!isLast && (
                  <div className="h-[2px] flex-1 bg-slate-200 mx-2 relative">
                    {phase.done && (
                      <div className="absolute inset-0 bg-primary" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
