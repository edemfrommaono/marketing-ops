import { Worker } from "bullmq";
import IORedis from "ioredis";
import { resend, DEFAULT_FROM_EMAIL } from "@/lib/email/client";
import { InviteCollaborator } from "@/lib/email/templates/InviteCollaborator";
import { DeadlineReminder } from "@/lib/email/templates/DeadlineReminder";
import { ContentApproved } from "@/lib/email/templates/ContentApproved";
import { RevisionRequired } from "@/lib/email/templates/RevisionRequired";
import { ContentRejected } from "@/lib/email/templates/ContentRejected";
import { CampaignStarted } from "@/lib/email/templates/CampaignStarted";
import { TaskAssigned } from "@/lib/email/templates/TaskAssigned";
import { ClientPortalInvite } from "@/lib/email/templates/ClientPortalInvite";
import { PasswordReset } from "@/lib/email/templates/PasswordReset";
import { EmailJob } from "./jobs";

// BullMQ requires maxRetriesPerRequest: null for blocking commands (BRPOP etc.)
const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

connection.on("connect", () => console.log("🔗 Worker Redis connected"));
connection.on("error",   (err) => console.error("Redis error:", err.message));

// Create main queue for exporting
export const queue = new (require("bullmq").Queue)("emailQueue", { connection });

export const syncWorker = new Worker(
  "syncQueue",
  async (job) => {
    console.log(`📦 Job [${job.name}] received — id: ${job.id}`);

    if (job.name === "odooSync") {
      console.log("🔄 Executing Odoo sync for user", job.data.userId);
      // TODO: call OdooClient.syncData(job.data.userId)
    }

    if (job.name === "sendReminder") {
      console.log("📧 Sending reminder for content", job.data.contentId);
      // TODO: call SMTP service
    }
  },
  { connection },
);

// Email worker
export const emailWorker = new Worker(
  "emailQueue",
  async (job) => {
    const emailJob = job.data as EmailJob;
    console.log(`📧 Processing email [${emailJob.type}] → ${emailJob.recipientEmail}`);

    try {
      let html: string;
      let subject: string;

      switch (emailJob.type) {
        case "invite-collaborator":
          html = InviteCollaborator({
            invitedByName: emailJob.data.invitedByName as string,
            invitedByCompany: emailJob.data.invitedByCompany as string,
            role: emailJob.data.role as string,
            inviteLink: emailJob.data.inviteLink as string,
            expiresAt: emailJob.data.expiresAt as string,
            recipientName: emailJob.data.recipientName as string,
          });
          subject = "Invitation à rejoindre Maono Ops";
          break;

        case "deadline-reminder":
          html = DeadlineReminder({
            contentTitle: emailJob.data.contentTitle as string,
            daysRemaining: emailJob.data.daysRemaining as number,
            contentLink: emailJob.data.contentLink as string,
          });
          subject = emailJob.data.subject as string || "Rappel de deadline";
          break;

        case "content-approved":
          html = ContentApproved({
            contentTitle: emailJob.data.contentTitle as string,
            approverName: emailJob.data.approverName as string,
            contentLink: emailJob.data.contentLink as string,
            nextStep: emailJob.data.nextStep as string,
          });
          subject = "Votre contenu a été approuvé ✨";
          break;

        case "revision-required":
          html = RevisionRequired({
            contentTitle: emailJob.data.contentTitle as string,
            reviewerName: emailJob.data.reviewerName as string,
            comment: emailJob.data.comment as string,
            contentLink: emailJob.data.contentLink as string,
          });
          subject = "Révision requise pour votre contenu 📝";
          break;

        case "content-rejected":
          html = ContentRejected({
            contentTitle: emailJob.data.contentTitle as string,
            reviewerName: emailJob.data.reviewerName as string,
            comment: emailJob.data.comment as string,
            contentLink: emailJob.data.contentLink as string,
          });
          subject = `Contenu refusé : ${emailJob.data.contentTitle}`;
          break;

        case "campaign-started":
          html = CampaignStarted({
            campaignName: emailJob.data.campaignName as string,
            campaignLink: emailJob.data.campaignLink as string,
            teamMemberCount: emailJob.data.teamMemberCount as number,
          });
          subject = `Campagne lancée: ${emailJob.data.campaignName} 🚀`;
          break;

        case "task-assigned":
          html = TaskAssigned({
            taskTitle: emailJob.data.taskTitle as string,
            taskDescription: emailJob.data.taskDescription as string,
            assigneeName: emailJob.data.assigneeName as string,
            deadline: emailJob.data.deadline as string,
            taskLink: emailJob.data.taskLink as string,
            priority: emailJob.data.priority as "low" | "normal" | "high" | "urgent" | undefined,
          });
          subject = `Nouvelle tâche: ${emailJob.data.taskTitle}`;
          break;

        case "client-portal-invite":
          html = ClientPortalInvite({
            clientName: emailJob.data.clientName as string,
            portalLink: emailJob.data.portalLink as string,
            agencyName: emailJob.data.agencyName as string,
            expiresAt:  emailJob.data.expiresAt as string | undefined,
          });
          subject = `Votre portail client ${emailJob.data.agencyName} est prêt`;
          break;

        case "password-reset":
          html = PasswordReset({
            resetLink: emailJob.data.resetLink as string,
            expiresAt: emailJob.data.expiresAt as string,
          });
          subject = "Réinitialisation de votre mot de passe — Maono Ops";
          break;

        default:
          throw new Error(`Unknown email type: ${emailJob.type}`);
      }

      // Send email via Resend
      const result = await resend.emails.send({
        from: DEFAULT_FROM_EMAIL,
        to: emailJob.recipientEmail,
        subject,
        html,
      });

      if (result.error) {
        throw result.error;
      }

      console.log(`✅ Email sent to ${emailJob.recipientEmail} | ID: ${result.data?.id}`);
      return { success: true, messageId: result.data?.id };
    } catch (err) {
      console.error(`❌ Failed to send email to ${emailJob.recipientEmail}:`, err);
      throw err;
    }
  },
  { connection },
);

syncWorker.on("completed", (job) => console.log(`✅ Job [${job.name}] completed`));
syncWorker.on("failed",    (job, err) => console.error(`❌ Job [${job?.name}] failed:`, err.message));

emailWorker.on("completed", (job) => console.log(`✅ Email job completed: ${job.id}`));
emailWorker.on("failed",    (job, err) => console.error(`❌ Email job failed [${job?.id}]:`, err.message));

console.log("🚀 BullMQ workers started — listening on queues: syncQueue, emailQueue");
