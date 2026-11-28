-- Seller product lifecycle: admin review evidence for products.
ALTER TABLE "Product" ADD COLUMN "reviewNotes" TEXT,
ADD COLUMN "reviewedAt" TIMESTAMP(3);
