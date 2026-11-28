CREATE TABLE "SocialRateLimitBucket" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SocialRateLimitBucket_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SocialRateLimitBucket_userId_action_windowStart_key" ON "SocialRateLimitBucket"("userId", "action", "windowStart");
CREATE INDEX "SocialRateLimitBucket_windowStart_idx" ON "SocialRateLimitBucket"("windowStart");
ALTER TABLE "SocialRateLimitBucket" ADD CONSTRAINT "SocialRateLimitBucket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
