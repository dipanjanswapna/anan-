ALTER TABLE "SellerOrder" ADD COLUMN "acceptanceDeadlineAt" TIMESTAMP(3);
UPDATE "SellerOrder"
SET "acceptanceDeadlineAt" = "createdAt" + INTERVAL '24 hours'
WHERE "status" = 'PENDING_ACCEPTANCE';
CREATE INDEX "SellerOrder_status_acceptanceDeadlineAt_idx"
ON "SellerOrder"("status", "acceptanceDeadlineAt");
