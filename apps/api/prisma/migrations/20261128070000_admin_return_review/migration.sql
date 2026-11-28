ALTER TABLE "ReturnRequest"
  ADD COLUMN "adminNotes" TEXT,
  ADD COLUMN "adminReviewedAt" TIMESTAMP(3),
  ADD COLUMN "adminReviewedByUserId" TEXT,
  ADD COLUMN "refundReference" TEXT,
  ADD COLUMN "refundMethod" TEXT,
  ADD COLUMN "refundAmountPaisa" BIGINT;
