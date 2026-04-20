-- Sprint 4: Schema additions
-- Run with: npx prisma migrate deploy

-- S4.1 — Add isActive to User (default true, non-breaking)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- S4.5 — PlatformSetting model
CREATE TABLE IF NOT EXISTS "PlatformSetting" (
    "id"        TEXT NOT NULL,
    "key"       TEXT NOT NULL,
    "value"     TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PlatformSetting_key_key" ON "PlatformSetting"("key");

-- S4.8 — reviewerId on Content
ALTER TABLE "Content" ADD COLUMN IF NOT EXISTS "reviewerId" TEXT;
ALTER TABLE "Content" ADD CONSTRAINT "Content_reviewerId_fkey"
    FOREIGN KEY ("reviewerId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
    DEFERRABLE INITIALLY DEFERRED;

-- S4.11 — ApprovalComment model
CREATE TABLE IF NOT EXISTS "ApprovalComment" (
    "id"         TEXT NOT NULL,
    "body"       TEXT NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvalId" TEXT NOT NULL,
    "authorId"   TEXT NOT NULL,
    CONSTRAINT "ApprovalComment_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "ApprovalComment" ADD CONSTRAINT "ApprovalComment_approvalId_fkey"
    FOREIGN KEY ("approvalId") REFERENCES "Approval"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApprovalComment" ADD CONSTRAINT "ApprovalComment_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
