interface WorkstreamCardProps {
  title: string;
  description: string;
  icon: string;
  progress: number;
  status: "On Track" | "At Risk" | "Pending" | "Completed";
  members: { initials: string; color?: string }[];
  extraMembers?: number;
}

const STATUS_STYLES = {
  "On Track":  "bg-emerald-50 text-emerald-700",
  "At Risk":   "bg-amber-50 text-amber-700",
  "Pending":   "bg-slate-100 text-slate-600",
  "Completed": "bg-green-100 text-green-800",
};
const PROGRESS_COLORS = {
  "On Track":  "bg-primary",
  "At Risk":   "bg-amber-500",
  "Pending":   "bg-slate-400",
  "Completed": "bg-green-500",
};

export function WorkstreamCard({ title, description, icon, progress, status, members, extraMembers }: WorkstreamCardProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="size-10 rounded-lg bg-slate-50 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary">{icon}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded ${STATUS_STYLES[status]}`}>
          {status}
        </span>
      </div>

      <h4 className="text-base font-bold text-primary mb-1">{title}</h4>
      <p className="text-sm text-slate-500 mb-4">{description}</p>

      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
        <span>Progress</span>
        <span className="font-medium">{progress}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4">
        <div
          className={`${PROGRESS_COLORS[status]} h-1.5 rounded-full transition-all`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex -space-x-2">
        {members.map((m, i) => (
          <div
            key={i}
            className="h-6 w-6 rounded-full ring-2 ring-white flex items-center justify-center text-2xs font-bold text-white"
            style={{ backgroundColor: m.color ?? "#94a3b8" }}
          >
            {m.initials}
          </div>
        ))}
        {extraMembers && (
          <div className="h-6 w-6 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-2xs font-medium text-slate-600">
            +{extraMembers}
          </div>
        )}
      </div>
    </div>
  );
}
