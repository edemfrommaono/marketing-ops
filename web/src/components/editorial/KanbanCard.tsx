import { ContentTypeBadge } from "@/components/ui/StatusBadge";

interface KanbanCardProps {
  title: string;
  type: string;
  date?: string;
  statusLabel?: string;
  statusIcon?: string;
  statusColor?: string;
  commentCount?: number;
  members?: { initials?: string; color?: string }[];
  extraMembers?: number;
  borderHover?: string;
}

export function KanbanCard({
  title,
  type,
  date,
  statusLabel,
  statusIcon,
  statusColor = "text-editorial",
  commentCount,
  members = [],
  extraMembers,
  borderHover = "hover:border-editorial/20",
}: KanbanCardProps) {
  return (
    <div className={`bg-white p-4 rounded-lg shadow-soft border border-slate-50 ${borderHover} transition-all duration-150 cursor-pointer group`}>
      {/* Type badge */}
      <div className="mb-3">
        <ContentTypeBadge type={type} />
      </div>

      {/* Title */}
      <h4 className="text-anthracite font-medium text-sm leading-snug mb-4">{title}</h4>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Avatars */}
        <div className="flex -space-x-2">
          {members.map((m, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-2xs font-bold text-white"
              style={{ backgroundColor: m.color ?? "#94a3b8" }}
            >
              {m.initials ?? "?"}
            </div>
          ))}
          {extraMembers && extraMembers > 0 && (
            <div className="w-6 h-6 rounded-full border-2 border-white bg-editorial/20 flex items-center justify-center text-2xs font-bold text-editorial">
              +{extraMembers}
            </div>
          )}
        </div>

        {/* Right side — date, status, or comment count */}
        {statusLabel ? (
          <div className={`flex items-center gap-1 ${statusColor}`}>
            {statusIcon && (
              <span className="material-symbols-outlined text-sm">{statusIcon}</span>
            )}
            <span className="text-2xs font-semibold">{statusLabel}</span>
          </div>
        ) : date ? (
          <div className="flex items-center gap-1 text-slate-400">
            <span className="material-symbols-outlined text-sm">schedule</span>
            <span className="text-2xs">{date}</span>
          </div>
        ) : commentCount !== undefined ? (
          <div className="flex items-center gap-1 text-slate-400">
            <span className="material-symbols-outlined text-sm">chat_bubble</span>
            <span className="text-2xs">{commentCount}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
