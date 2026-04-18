import { ContentStatus, ProductionTeam, RiskLevel } from "@prisma/client";

// ── Content type label badges (INTERNAL, CORPORATE…) ──
const TYPE_STYLES: Record<string, string> = {
  INTERNAL:  "bg-editorial/10 text-editorial",
  CORPORATE: "bg-gray-100 text-gray-700",
  EXTERNAL:  "bg-amber-100 text-amber-800",
  ECOSYSTEM: "bg-emerald-100 text-emerald-700",
  MARKET:    "bg-amber-100 text-amber-800",
};

// ── Content lifecycle status ──
const STATUS_STYLES: Record<ContentStatus, string> = {
  DRAFT:           "bg-gray-100 text-gray-600",
  IN_PRODUCTION:   "bg-blue-50 text-blue-700",
  INTERNAL_REVIEW: "bg-purple-50 text-purple-700",
  CLIENT_REVIEW:   "bg-violet-50 text-violet-700",
  APPROVED:        "bg-emerald-50 text-emerald-700",
  REVISION_REQUIRED: "bg-red-50 text-red-700",
  SCHEDULED:       "bg-sky-50 text-sky-700",
  PUBLISHED:       "bg-green-100 text-green-800",
  ARCHIVED:        "bg-slate-100 text-slate-500",
};

const STATUS_LABELS: Record<ContentStatus, string> = {
  DRAFT:             "Brouillon",
  IN_PRODUCTION:     "En production",
  INTERNAL_REVIEW:   "Révision interne",
  CLIENT_REVIEW:     "Révision client",
  APPROVED:          "Approuvé",
  REVISION_REQUIRED: "Révision requise",
  SCHEDULED:         "Planifié",
  PUBLISHED:         "Publié",
  ARCHIVED:          "Archivé",
};

// ── Risk level ──
const RISK_STYLES: Record<RiskLevel, string> = {
  LOW:      "bg-green-50 text-green-700",
  MEDIUM:   "bg-amber-50 text-amber-700",
  HIGH:     "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-800",
};

// ── Team ──
const TEAM_LABELS: Record<ProductionTeam, string> = {
  DESIGN:       "Design",
  PHOTOGRAPHY:  "Photo",
  VIDEO:        "Vidéo",
  COPYWRITING:  "Copy",
};

// ── Components ──

export function ContentTypeBadge({ type }: { type: string }) {
  const cls = TYPE_STYLES[type] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wide ${cls}`}>
      {type}
    </span>
  );
}

export function ContentStatusBadge({ status }: { status: ContentStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wide ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-bold uppercase tracking-wide ${RISK_STYLES[level]}`}>
      {level}
    </span>
  );
}

export function TeamBadge({ team }: { team: ProductionTeam }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-slate-100 text-slate-600 uppercase tracking-wide">
      {TEAM_LABELS[team]}
    </span>
  );
}
