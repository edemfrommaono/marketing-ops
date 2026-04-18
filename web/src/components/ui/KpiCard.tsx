interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaPositive?: boolean;
  subtext?: string;
  icon: string;
  featured?: boolean; // blue top border
  progress?: number;  // 0-100 — renders a mini progress bar instead of delta
}

export function KpiCard({
  label,
  value,
  delta,
  deltaPositive = true,
  subtext,
  icon,
  featured = false,
  progress,
}: KpiCardProps) {
  return (
    <div className={`bg-white p-6 rounded-xl shadow-soft border-t-2 ${featured ? "border-editorial" : "border-slate-200"}`}>
      <div className="flex justify-between items-start mb-4">
        <p className="text-slate-500 text-2xs font-semibold uppercase tracking-wider">{label}</p>
        <span className={`material-symbols-outlined text-xl ${featured ? "text-editorial" : "text-slate-400"}`}>
          {icon}
        </span>
      </div>

      <p className="text-anthracite text-3xl font-bold">{value}</p>

      <div className="mt-2">
        {progress !== undefined ? (
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-editorial h-1.5 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        ) : delta ? (
          <div className="flex items-center gap-1">
            <span className={`text-xs font-medium ${deltaPositive ? "text-green-500" : "text-red-500"}`}>
              {delta}
            </span>
            {subtext && <span className="text-slate-400 text-2xs">{subtext}</span>}
          </div>
        ) : subtext ? (
          <p className="text-slate-400 text-2xs">
            <span className="font-medium text-slate-600">{subtext}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
