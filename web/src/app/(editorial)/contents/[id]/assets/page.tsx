import Link from "next/link";
import { notFound } from "next/navigation";

const TYPE_ICONS: Record<string, string> = {
  VIDEO:    "video_file",
  IMAGE:    "image",
  DOCUMENT: "description",
  AUDIO:    "audio_file",
  RAW:      "raw_on",
};
const TYPE_COLORS: Record<string, string> = {
  VIDEO:    "bg-blue-50 text-blue-500",
  IMAGE:    "bg-purple-50 text-purple-500",
  DOCUMENT: "bg-slate-50 text-slate-400",
  AUDIO:    "bg-amber-50 text-amber-500",
  RAW:      "bg-slate-50 text-slate-400",
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000)     return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

export default async function ContentAssetsPage({ params }: { params: { id: string } }) {
  const content = await prisma.content.findUnique({
    where: { id: params.id },
    include: {
      assets: {
        orderBy: [{ isActive: "desc" }, { version: "desc" }],
        include:  { uploadedBy: { select: { name: true, email: true } } },
      },
      calendarEntry: {
        include: { campaign: { include: { client: { select: { name: true } } } } },
      },
    },
  }).catch(() => null);

  if (!content) notFound();

  const activeAssets   = content.assets.filter(a => a.isActive);
  const archivedAssets = content.assets.filter(a => !a.isActive);

  return (
    <div className="flex-1 min-h-screen">
      <main className="px-8 py-8 max-w-[1200px] mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <Link href="/contents" className="hover:text-anthracite transition-colors">File de production</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <Link href={`/contents/${params.id}`} className="hover:text-anthracite transition-colors">{content.title}</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-anthracite font-medium">Assets</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-anthracite">Assets — {content.title}</h2>
            <p className="text-slate-400 text-sm mt-1">
              {content.assets.length} fichier{content.assets.length !== 1 ? "s" : ""} · {activeAssets.length} actif{activeAssets.length !== 1 ? "s" : ""}
              {" · "}{content.calendarEntry.campaign.client?.name ?? content.calendarEntry.campaign.name}
            </p>
          </div>
          <label className="flex items-center gap-2 px-4 py-2 bg-editorial text-white rounded-lg text-sm font-semibold hover:bg-editorial/90 transition-colors shadow-sm cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">upload</span>
            Uploader un asset
            <input type="file" className="sr-only" multiple />
          </label>
        </div>

        {/* Drop zone */}
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 mb-8 text-center hover:border-editorial/40 hover:bg-editorial/5 transition-all cursor-pointer">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-3 block">cloud_upload</span>
          <p className="text-sm font-medium text-slate-500">Glissez vos fichiers ici ou <span className="text-editorial">parcourir</span></p>
          <p className="text-2xs text-slate-400 mt-1">Formats acceptés : MP4, MOV, JPG, PNG, PDF, MP3 · Max 500 MB par fichier</p>
        </div>

        {/* Empty state */}
        {content.assets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-slate-300 text-[48px] mb-3">folder_open</span>
            <p className="text-sm font-medium text-slate-500 mb-1">Aucun asset pour ce contenu</p>
            <p className="text-xs text-slate-400">Uploadez des fichiers pour démarrer la production.</p>
          </div>
        )}

        {/* Active assets */}
        {activeAssets.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Fichiers actifs ({activeAssets.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeAssets.map(asset => {
                const typeColor = TYPE_COLORS[asset.assetType] ?? "bg-slate-50 text-slate-400";
                const [bgColor, textColor] = typeColor.split(" ");
                const uploader = asset.uploadedBy?.name ?? asset.uploadedBy?.email ?? "Inconnu";
                const date = new Date(asset.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

                return (
                  <div key={asset.id} className="bg-white rounded-xl border border-slate-100 shadow-soft overflow-hidden hover:shadow-md transition-all group">
                    <div className={`h-32 flex items-center justify-center ${bgColor}`}>
                      <span className={`material-symbols-outlined text-5xl ${textColor}`}>
                        {TYPE_ICONS[asset.assetType] ?? "attach_file"}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-medium text-anthracite truncate mb-0.5">{asset.fileName}</p>
                      <p className="text-2xs text-slate-400">{formatBytes(asset.fileSize)} · v{asset.version} · {date}</p>
                      <p className="text-2xs text-slate-400 mt-0.5">Par {uploader}</p>
                      <div className="flex gap-2 mt-3">
                        <a
                          href={asset.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded text-xs font-medium hover:bg-slate-50 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">download</span>Télécharger
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Archived assets */}
        {archivedAssets.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Versions archivées ({archivedAssets.length})</h3>
            <div className="bg-white rounded-xl border border-slate-100 shadow-soft divide-y divide-slate-50">
              {archivedAssets.map(asset => {
                const typeColor = TYPE_COLORS[asset.assetType] ?? "bg-slate-50 text-slate-400";
                const uploader  = asset.uploadedBy?.name ?? asset.uploadedBy?.email ?? "Inconnu";
                const date      = new Date(asset.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

                return (
                  <div key={asset.id} className="px-5 py-3.5 flex items-center gap-4 opacity-60 hover:opacity-90 hover:bg-slate-50 transition-all">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColor}`}>
                      <span className="material-symbols-outlined text-[18px]">{TYPE_ICONS[asset.assetType] ?? "attach_file"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-anthracite truncate">{asset.fileName}</p>
                      <p className="text-2xs text-slate-400">{formatBytes(asset.fileSize)} · v{asset.version} · {date} · {uploader}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-2xs font-bold">Archivé</span>
                    <a
                      href={asset.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-300 hover:text-editorial transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">download</span>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
