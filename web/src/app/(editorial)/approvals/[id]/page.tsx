import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentStatusBadge } from "@/components/ui/StatusBadge";
import { PlatformBadge } from "@/components/editorial/PlatformBadge";
import { getContentById } from "@/lib/data/contents";
import {
  approveContent,
  requestRevision,
  rejectContent,
} from "@/lib/actions/approvals";

const CHECKLIST = [
  { id: "c1", label: "Cohérence avec le brief créatif",     checked: true  },
  { id: "c2", label: "Respect du ton de marque",            checked: true  },
  { id: "c3", label: "Données sources vérifiées",           checked: false },
  { id: "c4", label: "SEO optimisé (mots-clés cibles)",     checked: true  },
  { id: "c5", label: "Longueur conforme (800-1200 mots)",   checked: true  },
  { id: "c6", label: "Visuels inclus / demandés",           checked: false },
];

export default async function ApprovalReviewPage({ params }: { params: { id: string } }) {
  const content = await getContentById(params.id);
  if (!content) notFound();

  const checkedCount = CHECKLIST.filter(c => c.checked).length;

  const deadline = content.deadline
    ? new Date(content.deadline).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  const campaign   = content.calendarEntry.campaign;
  const clientName = campaign.client?.name ?? "—";
  const platform   = content.calendarEntry.platform;
  const bodyText   = content.briefNotes ?? "";

  // Thin wrapper Server Actions that read contentId + comment from FormData
  async function approveAction(formData: FormData) {
    "use server";
    const contentId = formData.get("contentId") as string;
    const comment   = formData.get("comment")   as string;
    await approveContent(contentId, comment);
  }

  async function revisionAction(formData: FormData) {
    "use server";
    const contentId = formData.get("contentId") as string;
    const comment   = formData.get("comment")   as string;
    await requestRevision(contentId, comment);
  }

  async function rejectAction(formData: FormData) {
    "use server";
    const contentId = formData.get("contentId") as string;
    const comment   = formData.get("comment")   as string;
    await rejectContent(contentId, comment);
  }

  return (
    <div className="flex-1 min-h-screen">
      <main className="px-8 py-8 max-w-[1400px] mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <Link href="/approvals" className="hover:text-anthracite transition-colors">Approbations</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-anthracite font-medium">{content.title}</span>
        </div>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ContentStatusBadge status={content.status} />
              <PlatformBadge platform={platform} />
            </div>
            <h1 className="text-2xl font-bold text-anthracite">{content.title}</h1>
            <p className="text-sm text-slate-400 mt-1">
              <Link href={`/campaigns/${campaign.id}`} className="hover:text-editorial">{campaign.name}</Link>
              {" · "}{clientName}{" · "}Deadline: <span className="text-amber-600 font-medium">{deadline}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Link href={`/contents/${params.id}`} className="flex items-center gap-2 h-9 px-4 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>Retour au contenu
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Content preview — left 3/5 */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-xl border border-slate-100 shadow-soft overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-anthracite">Aperçu du contenu</h3>
                <div className="flex gap-2">
                  <button className="px-3 py-1 border border-slate-200 rounded text-xs font-medium hover:bg-slate-50">Télécharger PDF</button>
                  <Link href={`/contents/${params.id}/assets`} className="px-3 py-1 border border-slate-200 rounded text-xs font-medium hover:bg-slate-50">Voir assets</Link>
                </div>
              </div>
              {/* Brief */}
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                <p className="text-2xs font-bold uppercase tracking-wider text-slate-400 mb-2">Brief créatif</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {content.briefNotes ?? <span className="italic text-slate-300">Aucun brief renseigné.</span>}
                </p>
              </div>
              {/* Body */}
              <div className="px-6 py-6">
                {bodyText ? (
                  <div className="prose prose-sm max-w-none text-anthracite">
                    {bodyText.split("\n\n").map((para, i) => {
                      if (para.startsWith("# "))  return <h1 key={i} className="text-lg font-bold mb-4">{para.slice(2)}</h1>;
                      if (para.startsWith("## ")) return <h2 key={i} className="text-base font-bold mt-5 mb-2 text-anthracite">{para.slice(3)}</h2>;
                      const rendered = para
                        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\n/g, "<br/>");
                      return <p key={i} className="text-sm text-slate-700 leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: rendered }} />;
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-300 italic">Aucun contenu à prévisualiser.</p>
                )}
              </div>
            </div>

            {/* Previous comments from approvals */}
            {content.approvals.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-6">
                <h3 className="text-sm font-bold text-anthracite mb-4">Commentaires précédents</h3>
                <div className="space-y-3">
                  {content.approvals.map((approval, i) => {
                    const note       = approval.internalNote ?? approval.clientNote;
                    const reviewer   = approval.reviewedBy;
                    const authorName = reviewer?.name ?? reviewer?.email ?? "Reviewer";
                    const reviewDate = approval.reviewedAt
                      ? new Date(approval.reviewedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                      : "";
                    if (!note) return null;
                    return (
                      <div key={i} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-editorial/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-editorial">{authorName[0]}</span>
                        </div>
                        <div className="flex-1 bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-anthracite">{authorName}</span>
                            {reviewDate && <span className="text-2xs text-slate-400">{reviewDate}</span>}
                          </div>
                          <p className="text-xs text-slate-600">{note}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Review panel — right 2/5 */}
          <div className="lg:col-span-2 space-y-5">
            {/* Checklist */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Checklist de révision</h4>
                <span className="text-xs font-bold text-anthracite">{checkedCount}/{CHECKLIST.length}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mb-4">
                <div className="h-1.5 bg-editorial rounded-full" style={{ width: `${(checkedCount / CHECKLIST.length) * 100}%` }} />
              </div>
              <div className="space-y-2.5">
                {CHECKLIST.map(item => (
                  <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                    <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                      item.checked ? "bg-editorial border-editorial" : "border-slate-300 group-hover:border-editorial/60"
                    }`}>
                      {item.checked && <span className="material-symbols-outlined text-white text-[12px]">check</span>}
                    </div>
                    <span className={`text-xs ${item.checked ? "text-slate-500 line-through" : "text-anthracite"}`}>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Decision form — textarea + 3 buttons via formAction */}
            <form className="space-y-5">
              <input type="hidden" name="contentId" value={params.id} />

              {/* Comment */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Votre commentaire</h4>
                <textarea
                  name="comment"
                  rows={5}
                  placeholder="Ajoutez vos remarques, suggestions ou corrections pour l'équipe de production..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-anthracite placeholder-slate-300 focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none resize-none"
                />
              </div>

              {/* Decision buttons */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Décision</h4>
                <div className="space-y-3">
                  <button
                    formAction={approveAction}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    Approuver
                  </button>
                  <button
                    formAction={revisionAction}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-amber-400 text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    Demander des modifications
                  </button>
                  <button
                    formAction={rejectAction}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-red-300 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                    Refuser
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
