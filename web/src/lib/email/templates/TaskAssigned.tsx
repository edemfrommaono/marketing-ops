/**
 * Task Assigned Email Template
 * Sent when a task is assigned to a team member
 */

export function TaskAssigned({
  taskTitle,
  taskDescription,
  assigneeName,
  deadline,
  taskLink,
  priority = "normal",
}: {
  taskTitle: string;
  taskDescription: string;
  assigneeName: string;
  deadline: string;
  taskLink: string;
  priority?: "low" | "normal" | "high" | "urgent";
}): string {
  const priorityColors: Record<string, string> = {
    low: "#6366f1",
    normal: "#3b82f6",
    high: "#f59e0b",
    urgent: "#ef4444",
  };

  const priorityLabels: Record<string, string> = {
    low: "Faible",
    normal: "Normale",
    high: "Élevée",
    urgent: "Urgente",
  };

  const priorityColor = priorityColors[priority];
  const priorityLabel = priorityLabels[priority];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
          background-color: #f9fafb;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 24px;
          text-align: center;
          color: white;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }
        .content {
          padding: 40px 24px;
        }
        .greeting {
          font-size: 16px;
          color: #111827;
          margin-bottom: 24px;
          line-height: 1.6;
        }
        .task-card {
          background-color: #f3f4f6;
          border-left: 4px solid ${priorityColor};
          padding: 20px;
          border-radius: 6px;
          margin: 24px 0;
        }
        .task-card h2 {
          margin: 0 0 12px 0;
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }
        .task-description {
          color: #4b5563;
          font-size: 14px;
          margin-bottom: 16px;
          line-height: 1.6;
        }
        .task-meta {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 16px;
        }
        .task-meta-item {
          display: flex;
          align-items: center;
          font-size: 14px;
          color: #374151;
        }
        .task-meta-item strong {
          color: #111827;
          margin-right: 8px;
          min-width: 80px;
        }
        .priority-badge {
          display: inline-block;
          background-color: ${priorityColor};
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .deadline-warning {
          color: ${priorityColor};
          font-weight: 600;
        }
        .button {
          display: inline-block;
          background-color: #cfa117;
          color: white;
          padding: 12px 32px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          margin-top: 24px;
          transition: background-color 0.2s;
        }
        .button:hover {
          background-color: #b8860f;
        }
        .divider {
          height: 1px;
          background-color: #e5e7eb;
          margin: 32px 0;
        }
        .footer {
          padding: 24px;
          background-color: #f9fafb;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
        .footer-text {
          margin: 0;
          line-height: 1.6;
        }
        @media (max-width: 600px) {
          .content {
            padding: 24px 16px;
          }
          .button {
            display: block;
            text-align: center;
            width: 100%;
            box-sizing: border-box;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Nouvelle Tâche Assignée</h1>
        </div>

        <div class="content">
          <p class="greeting">
            Bonjour,<br><br>
            Une nouvelle tâche vous a été assignée. Voici les détails ci-dessous.
          </p>

          <div class="task-card">
            <h2>${taskTitle}</h2>
            <p class="task-description">${taskDescription}</p>

            <div class="task-meta">
              <div class="task-meta-item">
                <strong>Assigné à :</strong> ${assigneeName}
              </div>
              <div class="task-meta-item">
                <strong>Deadline :</strong> <span class="deadline-warning">${deadline}</span>
              </div>
              <div class="task-meta-item">
                <strong>Priorité :</strong> <span class="priority-badge">${priorityLabel}</span>
              </div>
            </div>
          </div>

          <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
            Consultez les détails complets et marquez cette tâche comme en cours dès que vous êtes prêt(e).
          </p>

          <a href="${taskLink}" class="button">Voir la Tâche</a>

          <div class="divider"></div>

          <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0;">
            <strong>Lien rapide :</strong><br>
            <a href="${taskLink}" style="color: #3b82f6; text-decoration: none; word-break: break-all;">
              ${taskLink}
            </a>
          </p>
        </div>

        <div class="footer">
          <p class="footer-text">
            Cet email a été envoyé depuis Maono Ops.<br>
            Ne pas répondre à cet email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
