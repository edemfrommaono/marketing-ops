export function ClientPortalInvite({
  clientName,
  portalLink,
  agencyName,
  expiresAt,
}: {
  clientName: string;
  portalLink: string;
  agencyName: string;
  expiresAt?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1a1a2e; border-radius: 12px 12px 0 0; padding: 32px; text-align: center; }
        .body { background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 32px; }
        .button { background: #cfa117; color: white !important; padding: 14px 36px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 700; font-size: 15px; margin: 24px 0; }
        .link-box { background: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; font-size: 13px; word-break: break-all; color: #6b7280; margin-top: 12px; }
        .footer { margin-top: 24px; font-size: 12px; color: #9ca3af; text-align: center; }
        .badge { display: inline-block; background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; border-radius: 6px; padding: 4px 10px; font-size: 12px; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <p style="color: #cfa117; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 8px;">
            ${agencyName}
          </p>
          <h1 style="color: #ffffff; font-size: 22px; margin: 0;">Votre portail client est prêt</h1>
        </div>

        <div class="body">
          <p>Bonjour <strong>${clientName}</strong>,</p>

          <p>
            <strong>${agencyName}</strong> vous invite à consulter et approuver vos contenus directement
            depuis votre portail client dédié.
          </p>

          <p>Depuis votre portail, vous pourrez :</p>
          <ul style="color: #4b5563; font-size: 14px; line-height: 2;">
            <li>Consulter les contenus produits pour vous</li>
            <li>Approuver ou demander des modifications</li>
            <li>Suivre l'avancement de vos campagnes</li>
          </ul>

          <p style="text-align: center;">
            <a href="${portalLink}" class="button">Accéder à mon portail →</a>
          </p>

          <p style="font-size: 13px; color: #6b7280;">
            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
          </p>
          <div class="link-box">${portalLink}</div>

          ${expiresAt ? `
          <p style="margin-top: 20px; font-size: 13px; color: #6b7280;">
            ⏳ Ce lien expire le <strong>${expiresAt}</strong>. Contactez votre agence pour en obtenir un nouveau.
          </p>
          ` : ""}

          <div class="footer">
            <p>© ${new Date().getFullYear()} ${agencyName} — Plateforme éditoriale</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
