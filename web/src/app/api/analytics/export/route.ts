import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

function escapeCSV(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(cells: (string | number | null | undefined)[]): string {
  return cells.map(escapeCSV).join(",");
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await prisma.content.findMany({
      where: { status: "PUBLISHED" },
      include: {
        calendarEntry: {
          include: { campaign: { include: { client: { select: { company: true } } } } },
        },
        performance: true,
        publication:  { select: { publishedAt: true, platform: true, url: true } },
      },
      orderBy: { deadline: "desc" },
      take: 1000,
    });

    const header = row([
      "Titre", "Campagne", "Client", "Plateforme", "Statut publication",
      "Date publication", "Reach", "Impressions", "Engagement", "Clics", "Conversions", "CTR (%)",
    ]);

    const lines = data.map(ct => row([
      ct.title,
      ct.calendarEntry.campaign.name,
      ct.calendarEntry.campaign.client.company,
      ct.publication?.platform ?? ct.calendarEntry.platform,
      ct.status,
      ct.publication?.publishedAt
        ? new Date(ct.publication.publishedAt).toLocaleDateString("fr-FR")
        : "",
      ct.performance?.reach       ?? 0,
      ct.performance?.impressions ?? 0,
      ct.performance?.engagement  ?? 0,
      ct.performance?.clicks      ?? 0,
      ct.performance?.conversions ?? 0,
      ct.performance?.ctr != null ? ct.performance.ctr.toFixed(2) : "",
    ]));

    const csv = [header, ...lines].join("\n");
    const bom = "\uFEFF"; // UTF-8 BOM for Excel

    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(bom + csv, {
      headers: {
        "Content-Type":        "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="analytics-${date}.csv"`,
      },
    });
  } catch (err) {
    console.error("[analytics/export]", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
