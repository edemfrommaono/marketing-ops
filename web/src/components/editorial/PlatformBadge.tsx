const PLATFORM_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  INSTAGRAM: { bg: "bg-pink-100",   text: "text-pink-700",  icon: "photo_camera" },
  FACEBOOK:  { bg: "bg-blue-100",   text: "text-blue-700",  icon: "thumb_up" },
  LINKEDIN:  { bg: "bg-sky-100",    text: "text-sky-700",   icon: "business_center" },
  TIKTOK:    { bg: "bg-slate-800",  text: "text-white",     icon: "music_video" },
  YOUTUBE:   { bg: "bg-red-100",    text: "text-red-700",   icon: "play_circle" },
  X:         { bg: "bg-slate-100",  text: "text-slate-700", icon: "tag" },
};

export function PlatformBadge({ platform }: { platform: string }) {
  const s = PLATFORM_STYLES[platform] ?? { bg: "bg-gray-100", text: "text-gray-600", icon: "public" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold ${s.bg} ${s.text}`}>
      <span className="material-symbols-outlined text-[12px]">{s.icon}</span>
      {platform}
    </span>
  );
}
