"use client";

import { useState } from "react";
import { SlidePanel } from "@/components/ui/SlidePanel";

interface ContentPreview {
  id:          string;
  title:       string;
  briefNotes:  string | null;
  platform:    string;
  format:      string;
  campaign:    string;
  deadline:    string;
  status:      string;
}

interface Props {
  content: ContentPreview;
}

export function PublishingPreviewButton({ content }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors"
        title="Prévisualiser le contenu"
      >
        <span className="material-symbols-outlined text-[14px]">visibility</span>
        Prévisualiser
      </button>

      <SlidePanel open={open} onClose={() => setOpen(false)} title="Prévisualisation du contenu">
        <div className="space-y-5">
          {/* Title */}
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-sand mb-1">Titre</p>
            <p className="text-base font-bold text-foreground">{content.title}</p>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-block-light rounded-lg p-3">
              <p className="text-2xs text-sand mb-1">Plateforme</p>
              <p className="text-sm font-semibold text-foreground">{content.platform}</p>
            </div>
            <div className="bg-block-light rounded-lg p-3">
              <p className="text-2xs text-sand mb-1">Format</p>
              <p className="text-sm font-semibold text-foreground">{content.format}</p>
            </div>
            <div className="bg-block-light rounded-lg p-3">
              <p className="text-2xs text-sand mb-1">Campagne</p>
              <p className="text-sm font-semibold text-foreground truncate">{content.campaign}</p>
            </div>
            <div className="bg-block-light rounded-lg p-3">
              <p className="text-2xs text-sand mb-1">Deadline</p>
              <p className="text-sm font-semibold text-foreground">{content.deadline}</p>
            </div>
          </div>

          {/* Brief */}
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-sand mb-2">Brief créatif</p>
            {content.briefNotes ? (
              <div className="bg-block-light rounded-lg border border-secondary/10 p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {content.briefNotes}
              </div>
            ) : (
              <p className="text-sm text-sand italic">Aucun brief renseigné.</p>
            )}
          </div>

          {/* CTA */}
          <div className="pt-2">
            <a
              href={`/contents/${content.id}`}
              className="flex items-center justify-center gap-2 w-full py-2.5 border border-secondary/20 rounded-lg text-sm font-semibold text-secondary hover:bg-secondary/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              Voir le contenu complet
            </a>
          </div>
        </div>
      </SlidePanel>
    </>
  );
}
