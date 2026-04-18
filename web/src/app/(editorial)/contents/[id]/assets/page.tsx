import Link from "next/link";

const CONTENT = { id:"ct1", title:"Q4 teaser reel", platform:"INSTAGRAM", team:"VIDEO" };

const ASSETS = [
  { id:"a1", name:"teaser_v1_rough.mp4",      type:"VIDEO",    size:"142 MB", version:1, date:"Apr 5, 14h22",  uploader:"M. Dupont", status:"ARCHIVED", thumb:null },
  { id:"a2", name:"teaser_v2_montage.mp4",    type:"VIDEO",    size:"98 MB",  version:2, date:"Apr 10, 09h45", uploader:"M. Dupont", status:"CURRENT",  thumb:null },
  { id:"a3", name:"brief_creative.pdf",       type:"DOCUMENT", size:"1.2 MB", version:1, date:"Apr 1, 10h00",  uploader:"A. Martin", status:"CURRENT",  thumb:null },
  { id:"a4", name:"storyboard_v1.pdf",        type:"DOCUMENT", size:"3.4 MB", version:1, date:"Apr 2, 11h30",  uploader:"A. Martin", status:"ARCHIVED", thumb:null },
  { id:"a5", name:"soundtrack_v1.mp3",        type:"AUDIO",    size:"5.6 MB", version:1, date:"Apr 8, 16h00",  uploader:"M. Dupont", status:"CURRENT",  thumb:null },
];

const TYPE_ICONS: Record<string, string> = {
  VIDEO:    "video_file",
  IMAGE:    "image",
  DOCUMENT: "description",
  AUDIO:    "audio_file",
};
const TYPE_COLORS: Record<string, string> = {
  VIDEO:    "bg-blue-50 text-blue-500",
  IMAGE:    "bg-purple-50 text-purple-500",
  DOCUMENT: "bg-slate-50 text-slate-400",
  AUDIO:    "bg-amber-50 text-amber-500",
};

export default function ContentAssetsPage({ params }: { params: { id: string } }) {
  const current = ASSETS.filter(a => a.status === "CURRENT");
  const archived = ASSETS.filter(a => a.status === "ARCHIVED");

  return (
    <div className="flex-1 min-h-screen">
      <main className="px-8 py-8 max-w-[1200px] mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <Link href="/contents" className="hover:text-anthracite transition-colors">File de production</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <Link href={`/contents/${params.id}`} className="hover:text-anthracite transition-colors">{CONTENT.title}</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-anthracite font-medium">Assets</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-anthracite">Assets — {CONTENT.title}</h2>
            <p className="text-slate-400 text-sm mt-1">{ASSETS.length} fichiers · {current.length} actifs</p>
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
          <p className="text-2xs text-slate-400 mt-1">Formats acceptés: MP4, MOV, JPG, PNG, PDF, MP3 · Max 500 MB par fichier</p>
        </div>

        {/* Current assets */}
        <div className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Fichiers actifs ({current.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {current.map(asset => (
              <div key={asset.id} className="bg-white rounded-xl border border-slate-100 shadow-soft overflow-hidden hover:shadow-md transition-all group">
                {/* Preview area */}
                <div className={`h-32 flex items-center justify-center ${TYPE_COLORS[asset.type].split(" ")[0]}`}>
                  <span className={`material-symbols-outlined text-5xl ${TYPE_COLORS[asset.type].split(" ")[1]}`}>{TYPE_ICONS[asset.type]}</span>
                </div>
                {/* Info */}
                <div className="p-4">
                  <p className="text-sm font-medium text-anthracite truncate mb-0.5">{asset.name}</p>
                  <p className="text-2xs text-slate-400">{asset.size} · v{asset.version} · {asset.date}</p>
                  <p className="text-2xs text-slate-400 mt-0.5">Par {asset.uploader}</p>
                  <div className="flex gap-2 mt-3">
                    <button className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded text-xs font-medium hover:bg-slate-50 transition-colors">
                      <span className="material-symbols-outlined text-[14px]">download</span>Télécharger
                    </button>
                    <button className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded text-xs font-medium hover:bg-slate-50 transition-colors">
                      <span className="material-symbols-outlined text-[14px]">history</span>Versions
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Version history / archived */}
        {archived.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Versions archivées ({archived.length})</h3>
            <div className="bg-white rounded-xl border border-slate-100 shadow-soft divide-y divide-slate-50">
              {archived.map(asset => (
                <div key={asset.id} className="px-5 py-3.5 flex items-center gap-4 opacity-60 hover:opacity-90 hover:bg-slate-50 transition-all">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[asset.type]}`}>
                    <span className="material-symbols-outlined text-[18px]">{TYPE_ICONS[asset.type]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-anthracite truncate">{asset.name}</p>
                    <p className="text-2xs text-slate-400">{asset.size} · v{asset.version} · {asset.date} · {asset.uploader}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-2xs font-bold">Archivé</span>
                  <button className="text-slate-300 hover:text-editorial transition-colors">
                    <span className="material-symbols-outlined text-[18px]">download</span>
                  </button>
                  <button className="text-slate-300 hover:text-editorial transition-colors">
                    <span className="material-symbols-outlined text-[18px]">restore</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
