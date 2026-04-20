export function CampaignStarted({
  campaignName,
  campaignLink,
  teamMemberCount,
}: {
  campaignName: string;
  campaignLink: string;
  teamMemberCount: number;
}): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .launch { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
        .button { background: #10b981; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 style="color: #10b981;">🚀 Campaign Started!</h1>
        
        <div class="launch">
          <p>Great news! The campaign <strong>"${campaignName}"</strong> has been launched!</p>
          <p style="margin: 10px 0 0 0; color: #666;">You're part of a team of ${teamMemberCount} collaborators working on this campaign.</p>
        </div>
        
        <p style="margin-top: 30px; text-align: center;">
          <a href="${campaignLink}" class="button">View Campaign Dashboard</a>
        </p>
        
        <div class="footer">
          <p>You're receiving this email because you're assigned to this campaign.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
