export function ContentApproved({
  contentTitle,
  approverName,
  contentLink,
  nextStep,
}: {
  contentTitle: string;
  approverName: string;
  contentLink: string;
  nextStep: string;
}): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .success { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
        .button { background: #cfa117; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 style="color: #10b981;">✨ Content Approved!</h1>
        
        <div class="success">
          <p><strong>"${contentTitle}"</strong> has been approved by <strong>${approverName}</strong>.</p>
        </div>
        
        <p><strong>Next Step:</strong> ${nextStep}</p>
        
        <p style="margin-top: 30px; text-align: center;">
          <a href="${contentLink}" class="button">View Content</a>
        </p>
        
        <div class="footer">
          <p>You're receiving this email because you created this content in Maono Ops.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
