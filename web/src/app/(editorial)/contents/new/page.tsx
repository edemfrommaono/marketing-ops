import Link from "next/link";
import { getCampaigns } from "@/lib/data/campaigns";
import { createContent } from "@/lib/actions/contents";

const PLATFORMS = ["INSTAGRAM", "FACEBOOK", "LINKEDIN", "TIKTOK", "YOUTUBE", "X"];
const TEAMS     = ["DESIGN", "VIDEO", "PHOTOGRAPHY", "COPYWRITING"];
const FORMATS   = ["IMAGE", "VIDEO", "TEXT", "MIXED"];
const TYPES     = ["POST", "STORY", "REEL", "VIDEO", "ARTICLE", "INFOGRAPHIC", "CAROUSEL"];

const PLATFORM_ICONS: Record<string, string> = {
  INSTAGRAM: "photo_camera", FACEBOOK: "thumb_up", LINKEDIN: "business_center",
  TIKTOK: "music_video", YOUTUBE: "play_circle", X: "tag",
};
const TEAM_ICONS: Record<string, string> = {
  DESIGN: "palette", VIDEO: "videocam", PHOTOGRAPHY: "camera_alt", COPYWRITING: "edit_note",
};

export default async function NewContentPage() {
  const { campaigns } = await getCampaigns({ limit: 100 });

  return (
    <div className="flex-1 min-h-screen">
      <main className="px-8 py-8 max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
          <Link href="/contents" className="hover:text-anthracite transition-colors">File de production</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-anthracite">Nouveau contenu</span>
        </div>
        <h2 className="text-2xl font-bold text-anthracite mb-1">Créer un contenu</h2>
        <p className="text-slate-400 text-sm mb-8">Définissez le brief créatif et les paramètres de production</p>

        <form action={createContent} className="space-y-6">
          {/* Section 1 — Informations */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-6">
            <h3 className="text-xs font-bold text-anthracite uppercase tracking-wider mb-5">Informations générales</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-anthracite mb-1.5">Titre *</label>
                <input
                  type="text"
                  name="title"
                  placeholder="ex. Q4 teaser reel"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-anthracite mb-1.5">Campagne *</label>
                  <div className="relative">
                    <select
                      name="campaignId"
                      className="w-full appearance-none px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial outline-none bg-white"
                    >
                      <option value="">Sélectionner</option>
                      {campaigns.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-anthracite mb-1.5">Deadline *</label>
                  <input
                    type="date"
                    name="deadline"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-anthracite mb-1.5">Type de contenu</label>
                  <div className="relative">
                    <select
                      name="contentType"
                      className="w-full appearance-none px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial outline-none bg-white"
                    >
                      {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-anthracite mb-1.5">Format</label>
                  <div className="relative">
                    <select
                      name="format"
                      className="w-full appearance-none px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial outline-none bg-white"
                    >
                      {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-anthracite mb-1.5">Brief créatif *</label>
                <textarea
                  name="briefNotes"
                  rows={4}
                  placeholder="Décrivez le contenu, le ton, les messages clés, les contraintes techniques..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2 — Plateforme */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-6">
            <h3 className="text-xs font-bold text-anthracite uppercase tracking-wider mb-5">Plateforme de diffusion *</h3>
            <div className="grid grid-cols-3 gap-3">
              {PLATFORMS.map(p => (
                <label key={p} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:border-editorial/40 hover:bg-editorial/5 transition-all has-[:checked]:border-editorial has-[:checked]:bg-editorial/10">
                  <input type="radio" name="platform" value={p} className="sr-only" />
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">{PLATFORM_ICONS[p]}</span>
                  <span className="text-sm font-medium text-anthracite">{p}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 3 — Équipe */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-6">
            <h3 className="text-xs font-bold text-anthracite uppercase tracking-wider mb-5">Équipe responsable *</h3>
            <div className="grid grid-cols-2 gap-3">
              {TEAMS.map(t => (
                <label key={t} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:border-editorial/40 hover:bg-editorial/5 transition-all has-[:checked]:border-editorial has-[:checked]:bg-editorial/10">
                  <input type="radio" name="team" value={t} className="sr-only" />
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">{TEAM_ICONS[t]}</span>
                  <span className="text-sm font-medium text-anthracite">{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 4 — Options */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-6">
            <h3 className="text-xs font-bold text-anthracite uppercase tracking-wider mb-5">Options</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" name="isUrgent" value="true" className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 rounded-full peer-checked:bg-editorial transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                </div>
                <span className="text-sm text-anthracite font-medium">Marquer comme urgent</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-9 h-5 bg-slate-200 rounded-full peer-checked:bg-editorial transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                </div>
                <span className="text-sm text-anthracite font-medium">Créer automatiquement les rappels (J-7, J-3, J-1)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 rounded-full peer-checked:bg-editorial transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                </div>
                <span className="text-sm text-anthracite font-medium">Ajouter au calendrier éditorial</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Link href="/contents" className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Annuler
            </Link>
            <div className="flex gap-3">
              <button type="button" className="px-5 py-2.5 border border-editorial text-editorial rounded-lg text-sm font-semibold hover:bg-editorial/5 transition-colors">
                Brouillon
              </button>
              <button type="submit" className="px-5 py-2.5 bg-editorial text-white rounded-lg text-sm font-semibold hover:bg-editorial/90 transition-colors shadow-sm">
                Créer le contenu
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
