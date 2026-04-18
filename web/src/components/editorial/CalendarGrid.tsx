"use client";
import { useState } from "react";

const PLATFORMS = ["INSTAGRAM","FACEBOOK","LINKEDIN","TIKTOK","YOUTUBE","X"] as const;
const PLATFORM_COLORS: Record<string, string> = {
  INSTAGRAM: "bg-pink-100 text-pink-700 border-pink-200",
  FACEBOOK:  "bg-blue-100 text-blue-700 border-blue-200",
  LINKEDIN:  "bg-sky-100 text-sky-700 border-sky-200",
  TIKTOK:    "bg-slate-900 text-white border-slate-700",
  YOUTUBE:   "bg-red-100 text-red-700 border-red-200",
  X:         "bg-slate-100 text-slate-700 border-slate-200",
};
const STATUS_DOT: Record<string, string> = {
  DRAFT:             "bg-slate-300",
  IN_PRODUCTION:     "bg-blue-400",
  INTERNAL_REVIEW:   "bg-purple-400",
  CLIENT_REVIEW:     "bg-violet-400",
  APPROVED:          "bg-emerald-400",
  REVISION_REQUIRED: "bg-red-400",
  SCHEDULED:         "bg-sky-400",
  PUBLISHED:         "bg-green-500",
};

interface CalendarEntry {
  id: string;
  publicationDate: string;
  platform: string;
  contentType: string;
  theme: string;
  contents: { id: string; title: string; status: string }[];
}

interface CalendarGridProps {
  entries: CalendarEntry[];
  year: number;
  month: number; // 0-indexed
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

const MONTH_NAMES = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAY_NAMES   = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];

export function CalendarGrid({ entries, year, month }: CalendarGridProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDayOfMonth(year, month);

  // Group entries by day
  const byDay: Record<number, CalendarEntry[]> = {};
  entries.forEach((e) => {
    const d = new Date(e.publicationDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(e);
    }
  });

  // Build grid cells (leading empty + days)
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-soft overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {DAY_NAMES.map((d) => (
          <div key={d} className="py-3 text-center text-2xs font-semibold uppercase tracking-wider text-slate-400">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="min-h-[110px] bg-slate-50/50" />;

          const dayEntries = byDay[day] ?? [];
          const active = isToday(day);

          return (
            <div
              key={day}
              className={`min-h-[110px] p-2 cursor-pointer hover:bg-slate-50 transition-colors ${active ? "bg-editorial/5" : ""}`}
              onClick={() => setSelected(selected === `${day}` ? null : `${day}`)}
            >
              {/* Day number */}
              <div className="flex justify-between items-center mb-1.5">
                <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full
                  ${active ? "bg-editorial text-white" : "text-slate-600"}`}>
                  {day}
                </span>
                {dayEntries.length > 0 && (
                  <span className="text-2xs text-slate-400 font-medium">{dayEntries.length}</span>
                )}
              </div>

              {/* Entry pills */}
              <div className="space-y-1">
                {dayEntries.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-2xs border ${PLATFORM_COLORS[e.platform] ?? "bg-gray-100 text-gray-600 border-gray-200"} truncate`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[e.contents[0]?.status ?? "DRAFT"]}`} />
                    <span className="truncate">{e.theme}</span>
                  </div>
                ))}
                {dayEntries.length > 3 && (
                  <p className="text-2xs text-slate-400 pl-1">+{dayEntries.length - 3} autres</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
