/**
 * prisma/seed.ts
 * Run with: npx tsx prisma/seed.ts
 *
 * Creates the initial admin user.
 * Change the email/password before first use in production.
 */

import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail    = process.env.SEED_ADMIN_EMAIL    ?? "admin@maono-ops.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin1234!";
  const adminName     = process.env.SEED_ADMIN_NAME     ?? "Admin Maono";

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where:  { email: adminEmail },
    update: { hashedPassword, role: UserRole.ADMIN },
    create: {
      email:               adminEmail,
      name:                adminName,
      role:                UserRole.ADMIN,
      hashedPassword,
      onboardingCompleted: true,
    },
  });

  console.log(`✅ Admin user ready: ${admin.email} (id: ${admin.id})`);

  // ── Demo editor ─────────────────────────────────────────────────────────────
  const editorEmail = "editor@maono-ops.com";
  const editor = await prisma.user.upsert({
    where:  { email: editorEmail },
    update: {},
    create: {
      email:               editorEmail,
      name:                "Sophie L.",
      role:                UserRole.STRATEGIST,
      hashedPassword:      await bcrypt.hash("Editor1234!", 12),
      onboardingCompleted: true,
    },
  });

  console.log(`✅ Editor user ready: ${editor.email} (id: ${editor.id})`);

  // ── User papdav ─────────────────────────────────────────────────────────────
  const papdavEmail = "papdav@maono.co";
  const papdav = await prisma.user.upsert({
    where:  { email: papdavEmail },
    update: { role: UserRole.ADMIN },
    create: {
      email:               papdavEmail,
      name:                "Papdav",
      role:                UserRole.ADMIN,
      hashedPassword:      await bcrypt.hash("Maono2026!", 12),
      onboardingCompleted: true,
    },
  });

  console.log(`✅ User papdav ready: ${papdav.email} (id: ${papdav.id})`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
