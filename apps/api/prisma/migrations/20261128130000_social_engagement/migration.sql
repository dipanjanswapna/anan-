CREATE TYPE "SocialCommentStatus" AS ENUM ('PENDING_REVIEW', 'PUBLISHED', 'HIDDEN', 'REMOVED');

CREATE TABLE "CreatorFollow" (
  "id" TEXT NOT NULL,
  "followerUserId" TEXT NOT NULL,
  "creatorProfileId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CreatorFollow_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SocialPostLike" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SocialPostLike_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SocialPostComment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" "SocialCommentStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "moderationNote" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SocialPostComment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SocialPostSave" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SocialPostSave_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SocialNotification" (
  "id" TEXT NOT NULL,
  "recipientUserId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "postId" TEXT,
  "type" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SocialNotification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreatorFollow_followerUserId_creatorProfileId_key" ON "CreatorFollow"("followerUserId", "creatorProfileId");
CREATE INDEX "CreatorFollow_creatorProfileId_createdAt_idx" ON "CreatorFollow"("creatorProfileId", "createdAt");
CREATE INDEX "CreatorFollow_followerUserId_createdAt_idx" ON "CreatorFollow"("followerUserId", "createdAt");
CREATE UNIQUE INDEX "SocialPostLike_userId_postId_key" ON "SocialPostLike"("userId", "postId");
CREATE INDEX "SocialPostLike_postId_createdAt_idx" ON "SocialPostLike"("postId", "createdAt");
CREATE INDEX "SocialPostComment_postId_status_createdAt_idx" ON "SocialPostComment"("postId", "status", "createdAt");
CREATE INDEX "SocialPostComment_userId_createdAt_idx" ON "SocialPostComment"("userId", "createdAt");
CREATE UNIQUE INDEX "SocialPostSave_userId_postId_key" ON "SocialPostSave"("userId", "postId");
CREATE INDEX "SocialPostSave_userId_createdAt_idx" ON "SocialPostSave"("userId", "createdAt");
CREATE INDEX "SocialNotification_recipientUserId_readAt_createdAt_idx" ON "SocialNotification"("recipientUserId", "readAt", "createdAt");

ALTER TABLE "CreatorFollow" ADD CONSTRAINT "CreatorFollow_followerUserId_fkey" FOREIGN KEY ("followerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreatorFollow" ADD CONSTRAINT "CreatorFollow_creatorProfileId_fkey" FOREIGN KEY ("creatorProfileId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialPostLike" ADD CONSTRAINT "SocialPostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialPostLike" ADD CONSTRAINT "SocialPostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialPostComment" ADD CONSTRAINT "SocialPostComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialPostComment" ADD CONSTRAINT "SocialPostComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialPostSave" ADD CONSTRAINT "SocialPostSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialPostSave" ADD CONSTRAINT "SocialPostSave_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialNotification" ADD CONSTRAINT "SocialNotification_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialNotification" ADD CONSTRAINT "SocialNotification_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SocialNotification" ADD CONSTRAINT "SocialNotification_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
