-- Add hashedPassword column for Credentials auth provider
ALTER TABLE "User" ADD COLUMN "hashedPassword" TEXT;
