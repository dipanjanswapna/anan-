CREATE TYPE "SellerPayoutStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'PAID');
CREATE TYPE "SellerEarningStatus" AS ENUM ('AVAILABLE', 'PAID');

ALTER TABLE "SellerProfile"
  ADD COLUMN "commissionBps" INTEGER NOT NULL DEFAULT 1000;

CREATE TABLE "SellerPayoutRequest" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "amountPaisa" BIGINT NOT NULL,
  "status" "SellerPayoutStatus" NOT NULL DEFAULT 'REQUESTED',
  "payoutMethod" TEXT NOT NULL,
  "payoutDestination" TEXT NOT NULL,
  "adminNotes" TEXT,
  "payoutReference" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "reviewedByUserId" TEXT,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SellerPayoutRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SellerEarning" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "sellerOrderId" TEXT NOT NULL,
  "payoutRequestId" TEXT,
  "grossPaisa" BIGINT NOT NULL,
  "commissionPaisa" BIGINT NOT NULL,
  "netPaisa" BIGINT NOT NULL,
  "status" "SellerEarningStatus" NOT NULL DEFAULT 'AVAILABLE',
  "deliveredAt" TIMESTAMP(3) NOT NULL,
  "releasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SellerEarning_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SellerEarning_sellerOrderId_key" ON "SellerEarning"("sellerOrderId");
CREATE INDEX "SellerEarning_sellerId_status_releasedAt_idx" ON "SellerEarning"("sellerId", "status", "releasedAt");
CREATE INDEX "SellerEarning_payoutRequestId_idx" ON "SellerEarning"("payoutRequestId");
CREATE INDEX "SellerPayoutRequest_sellerId_status_requestedAt_idx" ON "SellerPayoutRequest"("sellerId", "status", "requestedAt");
CREATE INDEX "SellerPayoutRequest_status_requestedAt_idx" ON "SellerPayoutRequest"("status", "requestedAt");
ALTER TABLE "SellerPayoutRequest" ADD CONSTRAINT "SellerPayoutRequest_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SellerEarning" ADD CONSTRAINT "SellerEarning_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SellerEarning" ADD CONSTRAINT "SellerEarning_sellerOrderId_fkey" FOREIGN KEY ("sellerOrderId") REFERENCES "SellerOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SellerEarning" ADD CONSTRAINT "SellerEarning_payoutRequestId_fkey" FOREIGN KEY ("payoutRequestId") REFERENCES "SellerPayoutRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
