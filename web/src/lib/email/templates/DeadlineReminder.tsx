export function DeadlineReminder({
  contentTitle,
  daysRemaining,
  contentLink,
}: {
  contentTitle: string;
  daysRemaining: number;
  contentLink: string;
}): string {
  const urgency = daysRemaining === 0 ? "TODAY!" : `in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`;
  const color = daysRemaining === 0 ? "#ef4444" : daysRemaining === 1 ? "#f59e0b" : "#3b82f6";
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .alert { background: #f5f5f5; border-left: 4px solid ${color}; padding: 20px; margin: 20px 0; }
        .deadline { font-size: 24px; font-weight: bold; color: ${color}; margin: 10px 0; }
        .button { background: ${color}; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 style="color: ${color};">⏰ Deadline Reminder</h1>
        
        <div class="alert">
          <p style="margin: 0 0 10px 0;"><strong>"${contentTitle}"</strong></p>
          <div class="deadline">Deadline ${urgency}</div>
          <p style="margin: 10px 0 0 0; color: #666;">Make sure to complete this content on time!</p>
        </div>
        
        <p style="margin-top: 30px; text-align: center;">
          <a href="${contentLink}" class="button">Go to Content</a>
        </p>
        
        <div class="footer">
          <p>You're receiving this reminder because this content is assigned to you.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
