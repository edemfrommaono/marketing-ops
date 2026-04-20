"use server";

import { prisma } from "@/lib/db";
import { enqueueEmail } from "@/lib/queue/enqueue";
import { UserRole } from "@prisma/client";
import { generateInviteToken, storeInviteToken } from "@/lib/auth/invite-token";

/**
 * Invite a collaborator to join the organization
 */
export async function inviteCollaborator(
  email: string,
  role: UserRole,
  invitedByUserId: string,
  companyName: string,
) {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error(`User with email ${email} already exists`);
  }

  // Get inviter details
  const inviter = await prisma.user.findUnique({
    where: { id: invitedByUserId },
  });

  if (!inviter) {
    throw new Error("Inviter not found");
  }

  // Generate invite token
  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Create user with pending email verification
  const newUser = await prisma.user.create({
    data: {
      email,
      role,
      onboardingCompleted: true, // They'll complete their own onboarding via invite link
      emailVerified: null, // Email not verified until they accept invite
    },
  });

  // Store invite token in database
  await storeInviteToken(token, email, 7 * 24 * 60 * 60 * 1000);

  // Create invite link
  const inviteLink = `${process.env.NEXTAUTH_URL}/auth/accept-invite?token=${token}&email=${encodeURIComponent(email)}`;

  // Enqueue email
  await enqueueEmail({
    type: "invite-collaborator",
    recipientEmail: email,
    recipientName: email.split("@")[0],
    data: {
      invitedByName: inviter.name || inviter.email,
      invitedByCompany: companyName,
      role,
      inviteLink,
      expiresAt: "7 days",
      subject: `Invitation à rejoindre Maono Ops`,
    },
  });

  return { success: true, userId: newUser.id, email };
}

/**
 * Notify about deadline approaching
 */
export async function notifyDeadlineApproaching(contentId: string, daysRemaining: number) {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    include: {
      tasks: {
        include: {
          assignedTo: true,
        },
      },
    },
  });

  if (!content || content.tasks.length === 0) {
    return;
  }

  // Send reminder to all assigned team members
  for (const task of content.tasks) {
    if (task.assignedTo?.email) {
      await enqueueEmail({
        type: "deadline-reminder",
        recipientEmail: task.assignedTo.email,
        recipientName: task.assignedTo.name || undefined,
        data: {
          contentTitle: content.title,
          daysRemaining,
          subject: `Rappel : ${daysRemaining}j avant deadline`,
        },
      });
    }
  }
}
