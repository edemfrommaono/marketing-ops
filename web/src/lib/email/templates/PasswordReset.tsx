export function PasswordReset({
  resetLink,
  expiresAt,
}: {
  resetLink: string;
  expiresAt: string;
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
        .header { background: #1e293b; border-radius: 12px 12px 0 0; padding: 32px; text-align: center; }
        .body { background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 32px; }
        .button { background: #cfa117; color: white !important; padding: 14px 36px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 700; font-size: 15px; margin: 24px 0; }
        .warning { background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #854d0e; margin-top: 20px; }
        .link-box { background: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; font-size: 13px; word-break: break-all; color: #6b7280; margin-top: 12px; }
        .footer { margin-top: 24px; font-size: 12px; color: #9ca3af; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span style="font-size: 36px;">🔑</span>
          <h1 style="color: #ffffff; font-size: 20px; margin: 8px 0 0;">Réinitialisation de mot de passe</h1>
        </div>

        <div class="body">
          <p>Vous avez demandé à réinitialiser votre mot de passe sur <strong>Maono Ops</strong>.</p>

          <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>

          <p style="text-align: center;">
            <a href="${resetLink}" class="button">Réinitialiser mon mot de passe</a>
          </p>

          <p style="font-size: 13px; color: #6b7280;">
            Ou copiez ce lien dans votre navigateur :
          </p>
          <div class="link-box">${resetLink}</div>

          <div class="warning">
            ⏳ Ce lien expire le <strong>${expiresAt}</strong>.<br/>
            Si vous n'avez pas fait cette demande, ignorez cet email — votre compte reste sécurisé.
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} Maono Ops — Plateforme éditoriale</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
