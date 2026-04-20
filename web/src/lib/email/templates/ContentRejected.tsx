/**
 * Content Rejected Email Template
 * Sent to assignees when a content item is rejected and archived
 */

export function ContentRejected({
  contentTitle,
  reviewerName,
  comment,
  contentLink,
}: {
  contentTitle: string;
  reviewerName: string;
  comment: string;
  contentLink: string;
}): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #333; background: #f9fafb; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { background: #ef4444; padding: 32px 24px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
        .content { padding: 32px 24px; }
        .rejection-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px 20px; border-radius: 6px; margin: 20px 0; }
        .comment-box { background: #f3f4f6; padding: 16px; border-radius: 6px; margin: 16px 0; font-size: 14px; line-height: 1.6; color: #374151; }
        .button { background: #cfa117; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; }
        .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 24px; font-size: 12px; color: #9ca3af; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Contenu Refusé</h1>
        </div>
        <div class="content">
          <p>Bonjour,</p>
          <div class="rejection-box">
            <p style="margin:0;"><strong>"${contentTitle}"</strong> a été <strong>refusé</strong> par <strong>${reviewerName}</strong> et archivé.</p>
          </div>
          <p><strong>Raison du refus :</strong></p>
          <div class="comment-box">${comment || "Aucun commentaire fourni."}</div>
          <p style="color: #6b7280; font-size: 14px;">Si vous pensez que ce refus est une erreur, contactez directement <strong>${reviewerName}</strong>.</p>
          <p style="margin-top: 28px; text-align: center;">
            <a href="${contentLink}" class="button">Voir le contenu archivé</a>
          </p>
        </div>
        <div class="footer">
          <p>Cet email a été envoyé depuis Maono Ops. Ne pas répondre.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
