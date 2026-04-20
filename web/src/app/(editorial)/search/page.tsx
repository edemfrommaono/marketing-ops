import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { PlatformBadge } from "@/components/editorial/PlatformBadge";
import { ContentStatusBadge } from "@/components/ui/StatusBadge";
import { ContentStatus, ProductionTeam } from "@prisma/client";
import { SearchFilters } from "@/components/editorial/SearchFilters";

interface Props {
  searchParams: { q?: string; status?: string; team?: string; type?: string };
}


export default async function SearchPage({ searchParams }: Props) {
  const q      = (searchParams.q      ?? "").trim();
  const status = searchParams.status as ContentStatus | undefined;
  const team   = searchParams.team   as ProductionTeam | undefined;
  const type   = searchParams.type;          // "contents" | "campaigns" | "clients" | undefined (all)

  if (!q) {
    return (
      <div className="flex-1 min-h-screen">
        <main className="px-8 py-8 max-w-[1200px] mx-auto">
          <h2 className="text-2xl font-bold text-anthracite mb-2">Recherche</h2>
          <p className="text-slate-400 text-sm">Entrez un terme dans la barre de recherche.</p>
        </main>
      </div>
    );
  }

  const showContents  = !type || type === "contents";
  const showCampaigns = !type || type === "campaigns";
  const showClients   = !type || type === "clients";

  const [contents, campaigns, clients] = await Promise.all([
    showContents
      ? prisma.content.findMany({
          where: {
            title: { contains: q, mode: "insensitive" },
            NOT:   { status: "ARCHIVED" },
            ...(status && { status }),
            ...(team   && { assignedTeam: team }),
          },
          include: {
            calendarEntry: {
              include: { campaign: { select: { id: true, name: true } } },
            },
          },
          orderBy: { deadline: "asc" },
          take:    20,
        })
      : Promise.resolve([]),
    showCampaigns
      ? prisma.campaign.findMany({
          where: {
            OR: [
              { name:      { contains: q, mode: "insensitive" } },
              { objective: { contains: q, mode: "insensitive" } },
            ],
            NOT: { status: "ARCHIVED" },
          },
          include: { client: { select: { company: true } } },
          orderBy: { startDate: "desc" },
          take:    10,
        })
      : Promise.resolve([]),
    showClients
      ? prisma.client.findMany({
          where: {
            OR: [
              { name:    { contains: q, mode: "insensitive" } },
              { company: { contains: q, mode: "insensitive" } },
              { email:   { contains: q, mode: "insensitive" } },
            ],
          },
          take: 10,
        })
      : Promise.resolve([]),
  ]);

  const total = contents.length + campaigns.length + clients.length;

  return (
    <div className="flex-1 min-h-screen">
      <main className="px-8 py-8 max-w-[1200px] mx-auto">

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-anthracite mb-1">
            Résultats pour &ldquo;{q}&rdquo;
          </h2>
          <p className="text-slate-400 text-sm">{total} résultat{total !== 1 ? "s" : ""} trouvé{total !== 1 ? "s" : ""}</p>
        </div>

        {/* Filter bar — Client Component with router.push, wrapped in Suspense */}
        <Suspense fallback={<div className="h-12 rounded-xl bg-slate-50 border border-slate-100 mb-8 animate-pulse" />}>
          <SearchFilters q={q} type={type} status={status} team={team} />
        </Suspense>

        {total === 0 && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4 block">search_off</span>
            <p className="text-sm font-medium text-slate-500 mb-1">Aucun résultat</p>
            <p className="text-xs text-slate-400">Essayez un terme différent.</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Contenus */}
          {contents.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">article</span>
                Contenus ({contents.length})
              </h3>
              <div className="space-y-2">
                {contents.map(ct => (
                  <Link
                    key={ct.id}
                    href={`/contents/${ct.id}`}
                    className="flex items-center gap-4 bg-white rounded-xl border border-slate-100 shadow-soft px-5 py-4 hover:shadow-md hover:border-editorial/20 transition-all group"
                  >
                    <span className="material-symbols-outlined text-editorial text-[20px]">article</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-anthracite group-hover:text-editorial transition-colors truncate">{ct.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{ct.calendarEntry.campaign.name}</p>
                    </div>
                    <PlatformBadge platform={ct.calendarEntry.platform} />
                    <ContentStatusBadge status={ct.status} />
                    <span className="material-symbols-outlined text-slate-300 text-[16px] group-hover:text-editorial transition-colors">chevron_right</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Campagnes */}
          {campaigns.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">campaign</span>
                Campagnes ({campaigns.length})
              </h3>
              <div className="space-y-2">
                {campaigns.map(c => (
                  <Link
                    key={c.id}
                    href={`/campaigns/${c.id}`}
                    className="flex items-center gap-4 bg-white rounded-xl border border-slate-100 shadow-soft px-5 py-4 hover:shadow-md hover:border-editorial/20 transition-all group"
                  >
                    <span className="material-symbols-outlined text-editorial text-[20px]">campaign</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-anthracite group-hover:text-editorial transition-colors truncate">{c.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{c.client.company}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.status === "ACTIVE"    ? "bg-emerald-50 text-emerald-700" :
                      c.status === "DRAFT"     ? "bg-slate-100 text-slate-600"   :
                      c.status === "PAUSED"    ? "bg-amber-50 text-amber-700"    :
                      c.status === "COMPLETED" ? "bg-blue-50 text-blue-700"      :
                      "bg-slate-100 text-slate-400"
                    }`}>
                      {c.status === "ACTIVE" ? "Actif" : c.status === "DRAFT" ? "Brouillon" :
                       c.status === "PAUSED" ? "En pause" : c.status === "COMPLETED" ? "Terminé" : "Archivé"}
                    </span>
                    <span className="material-symbols-outlined text-slate-300 text-[16px] group-hover:text-editorial transition-colors">chevron_right</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Clients */}
          {clients.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">business</span>
                Clients ({clients.length})
              </h3>
              <div className="space-y-2">
                {clients.map(cl => (
                  <Link
                    key={cl.id}
                    href={`/admin/clients/${cl.id}/portal`}
                    className="flex items-center gap-4 bg-white rounded-xl border border-slate-100 shadow-soft px-5 py-4 hover:shadow-md hover:border-editorial/20 transition-all group"
                  >
                    <span className="material-symbols-outlined text-editorial text-[20px]">business</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-anthracite group-hover:text-editorial transition-colors">{cl.company}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{cl.name} · {cl.email}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cl.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                      {cl.isActive ? "Actif" : "Inactif"}
                    </span>
                    <span className="material-symbols-outlined text-slate-300 text-[16px] group-hover:text-editorial transition-colors">chevron_right</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
