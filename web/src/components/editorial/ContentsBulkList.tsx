"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ContentStatusBadge, TeamBadge } from "@/components/ui/StatusBadge";
import { PlatformBadge } from "@/components/editorial/PlatformBadge";
import { ContentStatus } from "@prisma/client";

interface ContentItem {
  id: string;
  title: string;
  status: ContentStatus;
  deadline: string | Date;
  assignedTeam: string;
  calendarEntry: {
    platform: string;
    campaign: { name: string };
  };
  _count: { assets: number; tasks: number };
}

interface Props {
  contents: ContentItem[];
}

async function bulkArchive(ids: string[]): Promise<{ success: boolean }> {
  const res = await fetch("/api/contents/bulk", {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ ids, action: "archive" }),
  });
  return res.json();
}

async function bulkAssignTeam(ids: string[], team: string): Promise<{ success: boolean }> {
  const res = await fetch("/api/contents/bulk", {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ ids, action: "assign-team", team }),
  });
  return res.json();
}

const TEAMS = [
  { value: "DESIGN",      label: "Design"       },
  { value: "VIDEO",       label: "Vidéo"        },
  { value: "PHOTOGRAPHY", label: "Photo"        },
  { value: "COPYWRITING", label: "Copywriting"  },
];

export function ContentsBulkList({ contents }: Props) {
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [teamPicker, setTeamPicker] = useState(false);
  const [feedback, setFeedback]     = useState<string | null>(null);

  const now = new Date();

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === contents.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(contents.map(c => c.id)));
    }
  }

  function handleArchive() {
    if (!selected.size) return;
    startTransition(async () => {
      const result = await bulkArchive(Array.from(selected));
      if (result.success) {
        setFeedback(`${selected.size} contenu(s) archivé(s).`);
        setSelected(new Set());
        // Refresh page data
        window.location.reload();
      }
    });
  }

  function handleAssignTeam(team: string) {
    if (!selected.size) return;
    setTeamPicker(false);
    startTransition(async () => {
      const result = await bulkAssignTeam(Array.from(selected), team);
      if (result.success) {
        setFeedback(`Équipe mise à jour pour ${selected.size} contenu(s).`);
        setSelected(new Set());
        window.location.reload();
      }
    });
  }

  const allSelected = selected.size === contents.length && contents.length > 0;
  const someSelected = selected.size > 0;

  return (
    <div>
      {/* Feedback banner */}
      {feedback && (
        <div className="flex items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-2.5 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            {feedback}
          </div>
          <button onClick={() => setFeedback(null)} className="text-emerald-500 hover:text-emerald-700">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center gap-3 bg-editorial/5 border border-editorial/20 rounded-xl px-4 py-3 mb-4">
          <span className="text-sm font-semibold text-editorial">
            {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
          </span>
          <div className="flex-1" />

          {/* Assign team */}
          <div className="relative">
            <button
              onClick={() => setTeamPicker(o => !o)}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-white transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">group</span>
              Assigner équipe
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>
            {teamPicker && (
              <div className="absolute right-0 top-9 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20">
                {TEAMS.map(t => (
                  <button
                    key={t.value}
                    onClick={() => handleAssignTeam(t.value)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 text-left"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Archive */}
          <button
            onClick={handleArchive}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[15px]">archive</span>
            Archiver
          </button>

          <button
            onClick={() => setSelected(new Set())}
            className="text-slate-400 hover:text-slate-600 ml-1"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Header row with select-all */}
      <div className="flex items-center gap-3 px-4 py-2 mb-1">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          className="w-4 h-4 rounded accent-editorial cursor-pointer"
        />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Tout sélectionner
        </span>
      </div>

      {/* List */}
      <div className="space-y-2">
        {contents.map(ct => {
          const deadline = new Date(ct.deadline);
          const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const isUrgent = daysLeft <= 2 && ct.status !== ContentStatus.PUBLISHED;
          const isChecked = selected.has(ct.id);

          return (
            <div
              key={ct.id}
              className={`flex items-center gap-3 bg-white rounded-xl border shadow-soft px-4 py-3.5 transition-all ${
                isChecked
                  ? "border-editorial/40 bg-editorial/3 ring-1 ring-editorial/20"
                  : isUrgent
                  ? "border-amber-200 bg-amber-50/10"
                  : "border-slate-100 hover:shadow-md"
              }`}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggle(ct.id)}
                className="w-4 h-4 rounded accent-editorial cursor-pointer flex-shrink-0"
              />

              {/* Urgent bar */}
              {isUrgent && !isChecked && (
                <div className="flex-shrink-0 w-1 h-10 rounded-full bg-amber-400" />
              )}

              {/* Title — clickable */}
              <Link href={`/contents/${ct.id}`} className="flex-1 min-w-0 group">
                <div className="flex items-center gap-2 mb-0.5">
                  {isUrgent && (
                    <span className="material-symbols-outlined text-amber-500 text-[15px]">warning</span>
                  )}
                  <span className="text-sm font-semibold text-anthracite truncate group-hover:text-editorial transition-colors">
                    {ct.title}
                  </span>
                </div>
                <p className="text-2xs text-slate-400 truncate">{ct.calendarEntry.campaign.name}</p>
              </Link>

              <div className="flex-shrink-0">
                <PlatformBadge platform={ct.calendarEntry.platform as never} />
              </div>
              <div className="flex-shrink-0 w-36">
                <ContentStatusBadge status={ct.status} />
              </div>
              <div className="flex-shrink-0">
                <TeamBadge team={ct.assignedTeam as never} />
              </div>
              <div className="flex-shrink-0 flex items-center gap-1 text-slate-400">
                <span className="material-symbols-outlined text-[14px]">attach_file</span>
                <span className="text-xs">{ct._count.assets}</span>
              </div>
              <div className="flex-shrink-0 flex items-center gap-1 text-slate-400">
                <span className="material-symbols-outlined text-[14px]">task_alt</span>
                <span className="text-xs">{ct._count.tasks}</span>
              </div>
              <div className={`flex-shrink-0 flex items-center gap-1 text-xs font-medium ${isUrgent ? "text-amber-600" : "text-slate-400"}`}>
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                {daysLeft === 0 ? "Aujourd'hui" : daysLeft < 0 ? "En retard" : `J-${daysLeft}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
