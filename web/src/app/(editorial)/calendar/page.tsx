import Link from "next/link";
import { CalendarGrid } from "@/components/editorial/CalendarGrid";
import { PlatformBadge } from "@/components/editorial/PlatformBadge";
import { ContentStatusBadge } from "@/components/ui/StatusBadge";
import { ContentStatus } from "@/types/api";
import { getCalendarEntries, getPlatformBreakdown } from "@/lib/data/calendar";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams?: { year?: string; month?: string };
}) {
  const now = new Date();
  const year  = searchParams?.year  ? parseInt(searchParams.year,  10) : now.getFullYear();
  const month = searchParams?.month ? parseInt(searchParams.month, 10) : now.getMonth();

  const from = new Date(year, month, 1);
  const to   = new Date(year, month + 1, 0);

  const [rawEntries, platformBreakdown] = await Promise.all([
    getCalendarEntries({ from, to }),
    getPlatformBreakdown(from, to),
  ]);

  // Map Prisma payloads to the CalendarEntry shape expected by CalendarGrid
  const entries = rawEntries.map(e => ({
    id:              e.id,
    publicationDate: e.publicationDate.toISOString(),
    platform:        e.platform,
    contentType:     e.contentType,
    theme:           e.theme,
    contents:        e.contents.map(c => ({ id: c.id, title: c.title, status: c.status })),
  }));

  const today = new Date();
  const UPCOMING = entries
    .filter(e => new Date(e.publicationDate) >= today)
    .sort((a, b) => new Date(a.publicationDate).getTime() - new Date(b.publicationDate).getTime())
    .slice(0, 5);

  const totalEntries = entries.length;

  // Navigation: prev month
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear  = month === 0 ? year - 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear  = month === 11 ? year + 1 : year;

  const monthName = [
    "Janvier","Février","Mars","Avril","Mai","Juin",
    "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
  ][month];

  return (
    <div className="flex-1 min-h-screen">
      <main className="px-8 py-8 max-w-[1400px] mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-anthracite text-2xl font-bold mb-1">Editorial Calendar</h2>
            <p className="text-slate-400 text-sm">Planification et suivi du contenu multi-plateformes</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`?year=${prevYear}&month=${prevMonth}`}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </Link>
            <span className="text-sm font-semibold text-anthracite w-36 text-center">{monthName} {year}</span>
            <Link
              href={`?year=${nextYear}&month=${nextMonth}`}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </Link>
            <Link
              href={`/calendar/new?year=${year}&month=${month}`}
              className="flex items-center gap-2 px-4 py-2 bg-editorial text-white rounded-lg text-sm font-medium hover:bg-editorial/90 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nouvelle entrée
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

          {/* ── Main calendar grid ── */}
          <div className="xl:col-span-3">
            <CalendarGrid entries={entries} year={year} month={month} />
          </div>

          {/* ── Right sidebar ── */}
          <div className="flex flex-col gap-5">

            {/* Platform breakdown */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-5">
              <h4 className="text-sm font-bold text-anthracite mb-4">Répartition plateformes</h4>
              <div className="space-y-3">
                {platformBreakdown.map(({ platform, count }) => (
                  <div key={platform} className="flex items-center justify-between">
                    <PlatformBadge platform={platform} />
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-editorial h-1.5 rounded-full"
                          style={{ width: totalEntries > 0 ? `${(count / totalEntries) * 100}%` : "0%" }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 font-medium w-4 text-right">{count}</span>
                    </div>
                  </div>
                ))}
                {platformBreakdown.length === 0 && (
                  <p className="text-xs text-slate-400">Aucune entrée ce mois-ci.</p>
                )}
              </div>
            </div>

            {/* Upcoming entries */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-5">
              <h4 className="text-sm font-bold text-anthracite mb-4">À venir</h4>
              <div className="space-y-4">
                {UPCOMING.length === 0 && (
                  <p className="text-xs text-slate-400">Aucune entrée à venir.</p>
                )}
                {UPCOMING.map((e) => {
                  const d = new Date(e.publicationDate);
                  return (
                    <div key={e.id} className="flex gap-3 items-start cursor-pointer group">
                      {/* Date block */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-editorial/10 flex flex-col items-center justify-center">
                        <span className="text-editorial text-xs font-bold leading-none">
                          {d.toLocaleDateString("fr-FR", { day: "2-digit" })}
                        </span>
                        <span className="text-editorial text-2xs leading-none uppercase">
                          {d.toLocaleDateString("fr-FR", { month: "short" })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-anthracite truncate group-hover:text-editorial transition-colors">
                          {e.theme}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <PlatformBadge platform={e.platform} />
                          <ContentStatusBadge status={(e.contents[0]?.status ?? "DRAFT") as ContentStatus} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-5">
              <h4 className="text-sm font-bold text-anthracite mb-3">Légende statuts</h4>
              <div className="space-y-2">
                {[
                  { label: "Brouillon",        dot: "bg-slate-300"  },
                  { label: "En production",    dot: "bg-blue-400"   },
                  { label: "Révision interne", dot: "bg-purple-400" },
                  { label: "Révision client",  dot: "bg-violet-400" },
                  { label: "Approuvé",         dot: "bg-emerald-400"},
                  { label: "Planifié",         dot: "bg-sky-400"    },
                  { label: "Publié",           dot: "bg-green-500"  },
                ].map(({ label, dot }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className="text-xs text-slate-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
