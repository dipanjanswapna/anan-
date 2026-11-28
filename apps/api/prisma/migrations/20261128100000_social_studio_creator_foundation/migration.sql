CREATE TYPE "SocialMediaType" AS ENUM ('IMAGE', 'VIDEO');
CREATE TYPE "SocialPostStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'HIDDEN');

CREATE TABLE "CreatorProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "handle" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "bio" TEXT,
  "avatarUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CreatorProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialPost" (
  "id" TEXT NOT NULL,
  "creatorProfileId" TEXT NOT NULL,
  "mediaType" "SocialMediaType" NOT NULL,
  "mediaUrl" TEXT NOT NULL,
  "caption" TEXT,
  "status" "SocialPostStatus" NOT NULL DEFAULT 'DRAFT',
  "moderationNotes" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreatorProfile_userId_key" ON "CreatorProfile"("userId");
CREATE UNIQUE INDEX "CreatorProfile_handle_key" ON "CreatorProfile"("handle");
CREATE INDEX "CreatorProfile_createdAt_idx" ON "CreatorProfile"("createdAt");
CREATE INDEX "SocialPost_status_createdAt_idx" ON "SocialPost"("status", "createdAt");
CREATE INDEX "SocialPost_creatorProfileId_status_createdAt_idx" ON "SocialPost"("creatorProfileId", "status", "createdAt");

ALTER TABLE "CreatorProfile" ADD CONSTRAINT "CreatorProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_creatorProfileId_fkey"
  FOREIGN KEY ("creatorProfileId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
