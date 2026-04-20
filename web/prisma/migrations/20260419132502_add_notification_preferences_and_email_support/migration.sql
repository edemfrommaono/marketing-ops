-- CreateTable
CREATE TABLE "NotificationPreferences" (
    "userId" TEXT NOT NULL,
    "deadlineReminders" BOOLEAN NOT NULL DEFAULT true,
    "approvalUpdates" BOOLEAN NOT NULL DEFAULT true,
    "campaignUpdates" BOOLEAN NOT NULL DEFAULT true,
    "taskAssignments" BOOLEAN NOT NULL DEFAULT true,
    "reminderDaysAdvance" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreferences_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreferences_userId_key" ON "NotificationPreferences"("userId");

-- AddForeignKey
ALTER TABLE "NotificationPreferences" ADD CONSTRAINT "NotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
