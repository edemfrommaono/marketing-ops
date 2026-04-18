import Link from "next/link";
import { prisma } from "@/lib/db";
import { createCalendarEntry } from "@/lib/actions/calendar";
import { Platform, ContentType } from "@prisma/client";

// ── Listes ───────────────────────────────────────────────────────────────────
const PLATFORMS: { value: Platform; label: string; icon: string }[] = [
  { value: "INSTAGRAM", label: "Instagram",  icon: "photo_camera"       },
  { value: "FACEBOOK",  label: "Facebook",   icon: "thumb_up"           },
  { value: "LINKEDIN",  label: "LinkedIn",   icon: "business_center"    },
  { value: "TIKTOK",    label: "TikTok",     icon: "music_video"        },
  { value: "YOUTUBE",   label: "YouTube",    icon: "play_circle"        },
  { value: "X",         label: "X (Twitter)",icon: "tag"                },
];

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "POST",       label: "Post"        },
  { value: "STORY",      label: "Story"       },
  { value: "REEL",       label: "Reel"        },
  { value: "VIDEO",      label: "Vidéo"       },
  { value: "ARTICLE",    label: "Article"     },
  { value: "INFOGRAPHIC",label: "Infographie" },
  { value: "CAROUSEL",   label: "Carousel"    },
];

export default async function NewCalendarEntryPage({
  searchParams,
}: {
  searchParams?: { error?: string; year?: string; month?: string };
}) {
  // Charger les campagnes actives depuis la DB
  let campaigns: { id: string; name: string; client: { name: string } }[] = [];
  try {
    campaigns = await prisma.campaign.findMany({
      where:   { status: { in: ["ACTIVE", "DRAFT"] } },
      select:  { id: true, name: true, client: { select: { name: true } } },
      orderBy: { name: "asc" },
    });
  } catch {
    // DB indisponible — formulaire avec liste vide
  }

  // Date par défaut = aujourd'hui
  const defaultDate = new Date().toISOString().split("T")[0];

  // URL de retour avec le mois courant si fourni
  const backHref = searchParams?.year && searchParams?.month
    ? `/calendar?year=${searchParams.year}&month=${searchParams.month}`
    : "/calendar";

  const errorMessages: Record<string, string> = {
    missing_fields: "Tous les champs obligatoires (*) doivent être remplis.",
    db_error:       "Erreur lors de la création. Veuillez réessayer.",
  };
  const errorMsg = searchParams?.error ? errorMessages[searchParams.error] : null;

  return (
    <div className="flex-1 min-h-screen">
      <main className="px-8 py-8 max-w-2xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
          <Link href="/calendar" className="hover:text-anthracite transition-colors">
            Calendrier
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-anthracite font-medium">Nouvelle entrée</span>
        </div>

        <h2 className="text-2xl font-bold text-anthracite mb-1">Nouvelle entrée calendrier</h2>
        <p className="text-slate-400 text-sm mb-8">
          Planifiez un slot éditorial sur le calendrier
        </p>

        {/* Bandeau d'erreur */}
        {errorMsg && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
            <span className="material-symbols-outlined text-[18px] flex-shrink-0">error</span>
            {errorMsg}
          </div>
        )}

        <form action={createCalendarEntry} className="space-y-6">

          {/* ── Section 1 : Informations générales ── */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-6">
            <h3 className="text-xs font-bold text-anthracite uppercase tracking-wider mb-5">
              Informations générales
            </h3>
            <div className="space-y-5">

              {/* Thème */}
              <div>
                <label className="block text-sm font-medium text-anthracite mb-1.5">
                  Thème / Titre de l&apos;entrée *
                </label>
                <input
                  type="text"
                  name="theme"
                  placeholder="ex. Lancement produit Q4 — teaser Instagram"
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none transition-all"
                />
              </div>

              {/* Campagne + Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-anthracite mb-1.5">
                    Campagne *
                  </label>
                  <div className="relative">
                    <select
                      name="campaignId"
                      required
                      className="w-full appearance-none px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial outline-none bg-white"
                    >
                      <option value="">Sélectionner</option>
                      {campaigns.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.client.name}
                        </option>
                      ))}
                      {campaigns.length === 0 && (
                        <option disabled>Aucune campagne disponible</option>
                      )}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">
                      expand_more
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-anthracite mb-1.5">
                    Date de publication *
                  </label>
                  <input
                    type="date"
                    name="publicationDate"
                    defaultValue={defaultDate}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial outline-none"
                  />
                </div>
              </div>

              {/* Type de contenu */}
              <div>
                <label className="block text-sm font-medium text-anthracite mb-1.5">
                  Type de contenu *
                </label>
                <div className="relative">
                  <select
                    name="contentType"
                    required
                    className="w-full appearance-none px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial outline-none bg-white"
                  >
                    {CONTENT_TYPES.map(ct => (
                      <option key={ct.value} value={ct.value}>{ct.label}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-anthracite mb-1.5">
                  Notes <span className="text-slate-400 font-normal">(optionnel)</span>
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Contexte, contraintes particulières, liens utiles..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* ── Section 2 : Plateforme ── */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-6">
            <h3 className="text-xs font-bold text-anthracite uppercase tracking-wider mb-5">
              Plateforme de diffusion *
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {PLATFORMS.map((p, i) => (
                <label
                  key={p.value}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:border-editorial/40 hover:bg-editorial/5 transition-all has-[:checked]:border-editorial has-[:checked]:bg-editorial/10"
                >
                  <input
                    type="radio"
                    name="platform"
                    value={p.value}
                    defaultChecked={i === 0}
                    className="sr-only"
                  />
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">
                    {p.icon}
                  </span>
                  <span className="text-sm font-medium text-anthracite">{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href={backHref}
              className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-editorial text-white rounded-lg text-sm font-semibold hover:bg-editorial/90 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Créer l&apos;entrée
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
