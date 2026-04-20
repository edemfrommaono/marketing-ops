import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

/**
 * Generate a secure invite token
 */
export function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Store an invite token in the database
 */
export async function storeInviteToken(token: string, email: string, expiresIn: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  const expiresAt = new Date(Date.now() + expiresIn);

  await prisma.inviteToken.create({
    data: {
      token,
      email,
      expiresAt,
    },
  });
}

/**
 * Validate and retrieve an invite token
 */
export async function validateInviteToken(token: string, email: string): Promise<boolean> {
  if (!token || !email || token.length !== 64) {
    return false;
  }

  const inviteToken = await prisma.inviteToken.findUnique({
    where: { token },
  });

  if (!inviteToken) {
    return false;
  }

  // Check if token matches email
  if (inviteToken.email !== email) {
    return false;
  }

  // Check if token is expired
  if (inviteToken.expiresAt < new Date()) {
    return false;
  }

  // Check if token was already used
  if (inviteToken.usedAt) {
    return false;
  }

  return true;
}

/**
 * Mark an invite token as used
 */
export async function markInviteTokenAsUsed(token: string): Promise<void> {
  await prisma.inviteToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });
}
