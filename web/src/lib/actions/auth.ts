"use server";

import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { validateInviteToken, markInviteTokenAsUsed, generateInviteToken, storeInviteToken } from "@/lib/auth/invite-token";
import { signIn } from "@/auth";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { enqueueEmail } from "@/lib/queue/enqueue";

interface AcceptInviteRequest {
  token: string;
  email: string;
  password: string;
}

interface AcceptInviteResponse {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Accept an invite token, set password, and activate account
 */
export async function acceptInvite({
  token,
  email,
  password,
}: AcceptInviteRequest): Promise<AcceptInviteResponse> {
  try {
    // Validate token
    const isValid = await validateInviteToken(token, email);
    if (!isValid) {
      return {
        success: false,
        error: "Lien d'invitation invalide ou expiré.",
      };
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        success: false,
        error: "Utilisateur non trouvé.",
      };
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Update user with password and mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        hashedPassword,
        emailVerified: new Date(),
      },
    });

    // Mark token as used
    await markInviteTokenAsUsed(token);

    // Auto-login: create session immediately after account activation
    // Use redirect: false to avoid unhandled redirect exception in Server Action
    try {
      await signIn("credentials", { email, password, redirect: false });
    } catch {
      // signIn may throw a redirect or NEXT_REDIRECT — those are safe to ignore here
      // The client will call router.refresh() + router.push() to pick up the new session
    }

    return {
      success: true,
      message: "Compte activé avec succès.",
    };
  } catch (error) {
    console.error("Accept invite error:", error);
    return {
      success: false,
      error: "Erreur lors de l'activation du compte. Veuillez réessayer.",
    };
  }
}

// ─── Admin: update user role ──────────────────────────────────────────────────

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Non authentifié." };

  const caller = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (caller?.role !== "ADMIN") return { success: false, error: "Accès refusé." };

  try {
    await prisma.user.update({ where: { id: userId }, data: { role } });
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour du rôle." };
  }
}

// ─── Admin: resend invite ─────────────────────────────────────────────────────

export async function resendInvite(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Non authentifié." };

  const caller = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (caller?.role !== "ADMIN") return { success: false, error: "Accès refusé." };

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.email) return { success: false, error: "Utilisateur introuvable." };

    // Invalidate existing tokens for this email
    await prisma.inviteToken.updateMany({
      where: { email: user.email, usedAt: null },
      data:  { usedAt: new Date() },
    });

    const token     = generateInviteToken();
    await storeInviteToken(token, user.email, 7 * 24 * 60 * 60 * 1000);

    const inviteLink = `${process.env.NEXTAUTH_URL}/auth/accept-invite?token=${token}&email=${encodeURIComponent(user.email)}`;

    await enqueueEmail({
      type:           "invite-collaborator",
      recipientEmail: user.email,
      recipientName:  user.name || user.email.split("@")[0],
      data: {
        invitedByName:    caller.name || "L'administrateur",
        invitedByCompany: "Maono Ops",
        role:             user.role,
        inviteLink,
        expiresAt:        "7 jours",
        recipientName:    user.name || user.email.split("@")[0],
      },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors du renvoi de l'invitation." };
  }
}

// ─── Forgot password ──────────────────────────────────────────────────────────

export async function forgotPassword(
  email: string
): Promise<{ success: boolean; error?: string }> {
  // Always return success (don't reveal if email exists)
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { success: true }; // silent — don't enumerate

    // Reuse InviteToken as a short-lived reset token (1h TTL)
    const token = generateInviteToken();
    await storeInviteToken(token, email, 60 * 60 * 1000); // 1 hour

    const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toLocaleTimeString("fr-FR", {
      hour: "2-digit", minute: "2-digit",
    });

    await enqueueEmail({
      type:           "password-reset",
      recipientEmail: email,
      recipientName:  user.name || undefined,
      data: { resetLink, expiresAt },
    });

    return { success: true };
  } catch (err) {
    console.error("[forgotPassword]", err);
    return { success: false, error: "Erreur lors de l'envoi. Réessayez." };
  }
}

// ─── Admin: deactivate / activate user ───────────────────────────────────────

export async function deactivateUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Non authentifié." };

  const caller = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (caller?.role !== "ADMIN") return { success: false, error: "Accès refusé." };

  // Cannot deactivate yourself
  if (userId === session.user.id) return { success: false, error: "Vous ne pouvez pas désactiver votre propre compte." };

  try {
    await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la désactivation." };
  }
}

export async function activateUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Non authentifié." };

  const caller = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (caller?.role !== "ADMIN") return { success: false, error: "Accès refusé." };

  try {
    await prisma.user.update({ where: { id: userId }, data: { isActive: true } });
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la réactivation." };
  }
}

// ─── Profile update ──────────────────────────────────────────────────────────

export async function updateProfile(
  data: { name?: string }
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Non authentifié." };

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data:  { name: data.name },
    });
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour du profil." };
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Non authentifié." };

  try {
    const user = await prisma.user.findUnique({
      where:  { id: session.user.id },
      select: { hashedPassword: true },
    });

    if (!user?.hashedPassword) {
      return { success: false, error: "Aucun mot de passe défini sur ce compte." };
    }

    const { compare } = await import("bcryptjs");
    const valid = await compare(currentPassword, user.hashedPassword);
    if (!valid) return { success: false, error: "Mot de passe actuel incorrect." };

    if (newPassword.length < 8) {
      return { success: false, error: "Le nouveau mot de passe doit contenir au moins 8 caractères." };
    }

    const hashedPassword = await hash(newPassword, 10);
    await prisma.user.update({
      where: { id: session.user.id },
      data:  { hashedPassword },
    });
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors du changement de mot de passe." };
  }
}

// ─── Reset password ───────────────────────────────────────────────────────────

export async function resetPassword(
  token: string,
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const isValid = await validateInviteToken(token, email);
    if (!isValid) return { success: false, error: "Lien invalide ou expiré." };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { success: false, error: "Utilisateur introuvable." };

    const hashedPassword = await hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data:  { hashedPassword, emailVerified: new Date() },
    });

    await markInviteTokenAsUsed(token);
    return { success: true };
  } catch (err) {
    console.error("[resetPassword]", err);
    return { success: false, error: "Erreur lors de la réinitialisation." };
  }
}
