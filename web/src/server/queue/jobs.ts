/**
 * Email job types for BullMQ queue
 */

export type EmailJobType =
  | "invite-collaborator"
  | "deadline-reminder"
  | "content-approved"
  | "revision-required"
  | "content-rejected"
  | "campaign-started"
  | "task-assigned"
  | "client-portal-invite"
  | "password-reset";

export interface EmailJob {
  type: EmailJobType;
  recipientEmail: string;
  recipientName?: string;
  data: Record<string, unknown>;
}
