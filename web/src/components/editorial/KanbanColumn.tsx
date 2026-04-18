interface KanbanColumnProps {
  title: string;
  count: number;
  dotColor: string;         // Tailwind bg-* class
  countColor: string;       // Tailwind text-* class
  bg: string;               // Tailwind bg-* class for column
  borderStyle?: string;     // e.g. "border border-dashed border-slate-200"
  children: React.ReactNode;
  showAddButton?: boolean;
  onAdd?: () => void;
  dimContent?: boolean;
}

export function KanbanColumn({
  title,
  count,
  dotColor,
  countColor,
  bg,
  borderStyle = "",
  children,
  showAddButton = false,
  onAdd,
  dimContent = false,
}: KanbanColumnProps) {
  return (
    <div className={`flex-1 min-w-[300px] max-w-[360px] ${bg} ${borderStyle} rounded-xl p-4 flex flex-col`}>
      {/* Column header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dotColor}`} />
          <h3 className="text-anthracite font-semibold text-sm">{title}</h3>
        </div>
        <span className={`bg-white ${countColor} text-2xs font-bold px-2 py-0.5 rounded shadow-sm`}>
          {count}
        </span>
      </div>

      {/* Cards */}
      <div className={`space-y-3 flex-1 ${dimContent ? "opacity-60" : ""}`}>
        {children}
      </div>

      {/* Add button */}
      {showAddButton && (
        <button
          onClick={onAdd}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-slate-400 hover:text-editorial hover:bg-white rounded-lg transition-all text-xs border border-dashed border-slate-300"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Ajouter un contenu
        </button>
      )}
    </div>
  );
}
