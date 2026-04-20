"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const STATUS_OPTIONS = [
  { value: "",                  label: "Tous les statuts"    },
  { value: "DRAFT",             label: "Brouillon"           },
  { value: "IN_PRODUCTION",     label: "En production"       },
  { value: "INTERNAL_REVIEW",   label: "Révision interne"    },
  { value: "CLIENT_REVIEW",     label: "Révision client"     },
  { value: "APPROVED",          label: "Approuvé"            },
  { value: "REVISION_REQUIRED", label: "Révision requise"    },
  { value: "SCHEDULED",         label: "Planifié"            },
  { value: "PUBLISHED",         label: "Publié"              },
];

const TEAM_OPTIONS = [
  { value: "",            label: "Toutes les équipes" },
  { value: "DESIGN",      label: "Design"             },
  { value: "VIDEO",       label: "Vidéo"              },
  { value: "PHOTOGRAPHY", label: "Photo"              },
  { value: "COPYWRITING", label: "Copywriting"        },
];

const TYPE_OPTIONS = [
  { value: "",          label: "Tout"       },
  { value: "contents",  label: "Contenus"   },
  { value: "campaigns", label: "Campagnes"  },
  { value: "clients",   label: "Clients"    },
];

interface Props {
  q:       string;
  type?:   string;
  status?: string;
  team?:   string;
}

export function SearchFilters({ q, type, status, team }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams({ q });
    const merged = { type, status, team, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    return `/search?${params.toString()}`;
  }

  function onChange(key: string, value: string) {
    router.push(buildUrl({ [key]: value || undefined }));
  }

  const hasFilter = !!(type || status || team);

  return (
    <div className="flex flex-wrap items-center gap-2 mb-8 p-3 bg-slate-50 rounded-xl border border-slate-100">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide mr-1">Filtrer</span>

      {/* Type chips */}
      {TYPE_OPTIONS.map(opt => {
        const active = (type ?? "") === opt.value;
        return (
          <Link
            key={opt.value || "all"}
            href={buildUrl({ type: opt.value || undefined })}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              active
                ? "bg-editorial text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {opt.label}
          </Link>
        );
      })}

      <div className="w-px h-5 bg-slate-200 mx-1" />

      {/* Status select */}
      <select
        value={status ?? ""}
        onChange={e => onChange("status", e.target.value)}
        className="px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 bg-white text-slate-600 outline-none cursor-pointer focus:border-editorial/40 transition-colors"
      >
        {STATUS_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Team select */}
      <select
        value={team ?? ""}
        onChange={e => onChange("team", e.target.value)}
        className="px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 bg-white text-slate-600 outline-none cursor-pointer focus:border-editorial/40 transition-colors"
      >
        {TEAM_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Reset */}
      {hasFilter && (
        <Link
          href={`/search?q=${encodeURIComponent(q)}`}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-700 transition-colors ml-auto"
        >
          <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>
          Réinitialiser
        </Link>
      )}
    </div>
  );
}
