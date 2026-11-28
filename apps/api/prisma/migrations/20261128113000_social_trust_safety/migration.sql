CREATE TYPE "SocialReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'HATE', 'VIOLENCE', 'SEXUAL_CONTENT', 'MISINFORMATION', 'COPYRIGHT', 'OTHER');
CREATE TYPE "SocialReportStatus" AS ENUM ('OPEN', 'DISMISSED', 'ACTION_TAKEN');

CREATE TABLE "SocialPostReport" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "reporterUserId" TEXT NOT NULL,
  "reason" "SocialReportReason" NOT NULL,
  "details" TEXT,
  "status" "SocialReportStatus" NOT NULL DEFAULT 'OPEN',
  "reviewNotes" TEXT,
  "reviewedByUserId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SocialPostReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CreatorBlock" (
  "id" TEXT NOT NULL,
  "blockerUserId" TEXT NOT NULL,
  "creatorProfileId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CreatorBlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SocialPostReport_postId_reporterUserId_key" ON "SocialPostReport"("postId", "reporterUserId");
CREATE INDEX "SocialPostReport_status_createdAt_idx" ON "SocialPostReport"("status", "createdAt");
CREATE INDEX "SocialPostReport_reporterUserId_createdAt_idx" ON "SocialPostReport"("reporterUserId", "createdAt");
CREATE UNIQUE INDEX "CreatorBlock_blockerUserId_creatorProfileId_key" ON "CreatorBlock"("blockerUserId", "creatorProfileId");
CREATE INDEX "CreatorBlock_creatorProfileId_createdAt_idx" ON "CreatorBlock"("creatorProfileId", "createdAt");

ALTER TABLE "SocialPostReport" ADD CONSTRAINT "SocialPostReport_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialPostReport" ADD CONSTRAINT "SocialPostReport_reporterUserId_fkey"
  FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreatorBlock" ADD CONSTRAINT "CreatorBlock_blockerUserId_fkey"
  FOREIGN KEY ("blockerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreatorBlock" ADD CONSTRAINT "CreatorBlock_creatorProfileId_fkey"
  FOREIGN KEY ("creatorProfileId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
