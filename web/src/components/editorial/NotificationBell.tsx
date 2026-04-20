"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedContentId?: string | null;
  relatedCampaignId?: string | null;
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  TASK_ASSIGNED:        "assignment_ind",
  DEADLINE_APPROACHING: "schedule",
  CONTENT_APPROVED:     "check_circle",
  REVISION_REQUIRED:    "edit_note",
  CONTENT_PUBLISHED:    "publish",
  RISK_FLAGGED:         "warning",
  CAMPAIGN_STARTED:     "rocket_launch",
};

const TYPE_COLORS: Record<string, string> = {
  TASK_ASSIGNED:        "text-blue-500",
  DEADLINE_APPROACHING: "text-amber-500",
  CONTENT_APPROVED:     "text-emerald-500",
  REVISION_REQUIRED:    "text-orange-500",
  CONTENT_PUBLISHED:    "text-purple-500",
  RISK_FLAGGED:         "text-red-500",
  CAMPAIGN_STARTED:     "text-editorial",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return "À l'instant";
  if (mins  < 60) return `Il y a ${mins}min`;
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${days}j`;
}

function notifHref(n: AppNotification): string {
  if (n.relatedContentId)  return `/contents/${n.relatedContentId}`;
  if (n.relatedCampaignId) return `/campaigns/${n.relatedCampaignId}`;
  return "#";
}

export function NotificationBell() {
  const [open, setOpen]               = useState(false);
  const [notifications, setNotifs]    = useState<AppNotification[]>([]);
  const [unreadCount, setUnread]      = useState(0);
  const [loading, setLoading]         = useState(false);
  const panelRef                      = useRef<HTMLDivElement>(null);

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/notifications");
      const data = await res.json();
      setNotifs(data.notifications ?? []);
      setUnread(data.unreadCount   ?? 0);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount + every 60s
  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 60_000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleOpen = async () => {
    setOpen(o => !o);
    if (!open && unreadCount > 0) {
      // Optimistically mark as read in UI
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnread(0);
      // Then persist
      fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative text-slate-400 hover:text-anthracite transition-colors"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-semibold text-anthracite">Notifications</span>
            {unreadCount === 0 && notifications.length > 0 && (
              <span className="text-xs text-slate-400">Tout lu</span>
            )}
            {loading && (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-editorial border-t-transparent animate-spin" />
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <span className="material-symbols-outlined text-3xl text-slate-200 block mb-2">notifications_none</span>
                <p className="text-xs text-slate-400">Aucune notification</p>
              </div>
            ) : (
              notifications.map(n => (
                <Link
                  key={n.id}
                  href={notifHref(n)}
                  onClick={() => setOpen(false)}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
                    !n.isRead ? "bg-blue-50/40" : ""
                  }`}
                >
                  <span className={`material-symbols-outlined text-[20px] mt-0.5 flex-shrink-0 ${TYPE_COLORS[n.type] ?? "text-slate-400"}`}>
                    {TYPE_ICONS[n.type] ?? "circle_notifications"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-anthracite leading-tight">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
