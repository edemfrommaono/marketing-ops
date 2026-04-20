export function RevisionRequired({
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
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .warning { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .comment { background: #f5f5f5; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .button { background: #cfa117; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 style="color: #f59e0b;">📝 Revision Required</h1>
        
        <div class="warning">
          <p><strong>"${contentTitle}"</strong> requires revisions from <strong>${reviewerName}</strong>.</p>
        </div>
        
        <p><strong>Reviewer Comment:</strong></p>
        <div class="comment">${comment}</div>
        
        <p style="margin-top: 30px; text-align: center;">
          <a href="${contentLink}" class="button">Review & Update Content</a>
        </p>
        
        <div class="footer">
          <p>You're receiving this email because you created this content in Maono Ops.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
