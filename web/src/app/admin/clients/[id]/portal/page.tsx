import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createPortalToken, revokePortalToken } from "@/lib/actions/clients";
import Link from "next/link";

interface Props {
  params: { id: string };
}

export default async function ClientPortalPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      portalTokens: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) redirect("/admin/clients");

  const activeTokens   = client.portalTokens.filter(t => t.isActive);
  const inactiveTokens = client.portalTokens.filter(t => !t.isActive);
  const baseUrl        = process.env.NEXTAUTH_URL ?? "";

  // Server action wrappers (pass clientId / tokenId)
  async function handleCreate() {
    "use server";
    await createPortalToken(params.id);
  }

  async function handleRevoke(formData: FormData) {
    "use server";
    const tokenId = formData.get("tokenId") as string;
    if (tokenId) await revokePortalToken(tokenId);
  }

  return (
    <div className="max-w-[800px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/admin/clients`}
          className="p-2 rounded-lg hover:bg-block-light text-sand hover:text-secondary transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Portail client — {client.name}</h1>
          <p className="text-sand text-sm mt-1">Gérez les liens d'accès au portail de révision</p>
        </div>
      </div>

      {/* Active tokens */}
      <div className="card rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-foreground">Liens actifs</h2>
          <form action={handleCreate}>
            <button
              type="submit"
              className="btn-cta flex items-center gap-2 text-sm"
            >
              <span className="material-symbols-outlined text-[16px]">add_link</span>
              Générer un nouveau lien
            </button>
          </form>
        </div>

        {activeTokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="material-symbols-outlined text-sand text-[32px] mb-3">link_off</span>
            <p className="text-sm text-sand">Aucun lien actif. Générez-en un pour inviter le client.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTokens.map(t => {
              const portalUrl = `${baseUrl}/client/${t.token}`;
              const isExpired = t.expiresAt && t.expiresAt < new Date();
              return (
                <div
                  key={t.id}
                  className={`rounded-lg border p-4 ${isExpired ? "border-amber-200 bg-amber-50/50" : "border-secondary/10 bg-block-light/30"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-sand truncate">{portalUrl}</p>
                      {t.expiresAt && (
                        <p className={`text-2xs mt-1 ${isExpired ? "text-amber-600 font-semibold" : "text-sand"}`}>
                          {isExpired ? "⚠️ Expiré le " : "Expire le "}
                          {t.expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Copy button (client-side) */}
                      <button
                        type="button"
                        onClick={undefined}
                        data-copy={portalUrl}
                        className="p-1.5 rounded-lg hover:bg-block-light text-sand hover:text-secondary transition-colors copy-btn"
                        title="Copier le lien"
                      >
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      </button>
                      {/* Revoke */}
                      <form action={handleRevoke}>
                        <input type="hidden" name="tokenId" value={t.id} />
                        <button
                          type="submit"
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-sand hover:text-red-400 transition-colors"
                          title="Révoquer ce lien"
                        >
                          <span className="material-symbols-outlined text-[16px]">link_off</span>
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Revoked / expired tokens */}
      {inactiveTokens.length > 0 && (
        <div className="card rounded-xl p-6">
          <h2 className="text-sm font-bold text-foreground mb-4">
            Historique ({inactiveTokens.length} lien{inactiveTokens.length > 1 ? "s" : ""} révoqué{inactiveTokens.length > 1 ? "s" : ""})
          </h2>
          <div className="space-y-2">
            {inactiveTokens.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center gap-3 py-2 border-b border-secondary/5 last:border-0">
                <span className="material-symbols-outlined text-sand text-[16px]">link_off</span>
                <p className="text-xs font-mono text-sand/60 truncate flex-1">{t.token.slice(0, 24)}…</p>
                <p className="text-2xs text-sand/40 flex-shrink-0">
                  {t.createdAt.toLocaleDateString("fr-FR")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Client script: copy to clipboard */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.querySelectorAll('.copy-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const url = btn.getAttribute('data-copy');
            if (url) {
              navigator.clipboard.writeText(url).then(() => {
                const icon = btn.querySelector('.material-symbols-outlined');
                if (icon) { icon.textContent = 'check'; setTimeout(() => { icon.textContent = 'content_copy'; }, 2000); }
              });
            }
          });
        });
      `}} />
    </div>
  );
}
