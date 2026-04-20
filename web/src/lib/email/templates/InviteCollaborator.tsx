export function InviteCollaborator({
  invitedByName,
  invitedByCompany,
  role,
  inviteLink,
  expiresAt,
  recipientName,
}: {
  invitedByName: string;
  invitedByCompany: string;
  role: string;
  inviteLink: string;
  expiresAt: string;
  recipientName: string;
}): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .button { background: #cfa117; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="color: #1a1a1a; margin: 0;">Welcome to Maono Ops!</h1>
        </div>
        
        <p>Hi ${recipientName},</p>
        
        <p><strong>${invitedByName}</strong> from <strong>${invitedByCompany}</strong> has invited you to join <strong>Maono Ops</strong> as a <strong>${role}</strong>.</p>
        
        <p style="margin-top: 30px; text-align: center;">
          <a href="${inviteLink}" class="button">Accept Invitation & Create Account</a>
        </p>
        
        <p style="margin-top: 30px; font-size: 14px; color: #666;">
          Or copy this link if the button doesn't work:<br/>
          <code style="background: #f5f5f5; padding: 10px; display: block; word-break: break-all;">${inviteLink}</code>
        </p>
        
        <div class="footer">
          <p>This invitation link expires on <strong>${expiresAt}</strong> (7 days from invitation).</p>
          <p>If you don't recognize this invitation or have any questions, please contact ${invitedByName}.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
