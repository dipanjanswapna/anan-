CREATE TYPE "ShipmentStatus" AS ENUM (
  'LABEL_CREATED',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'DELIVERY_FAILED',
  'RETURNED'
);

CREATE TABLE "CourierShipment" (
  "id" TEXT NOT NULL,
  "sellerOrderId" TEXT NOT NULL,
  "courierName" TEXT NOT NULL,
  "trackingNumber" TEXT NOT NULL,
  "trackingUrl" TEXT,
  "status" "ShipmentStatus" NOT NULL DEFAULT 'LABEL_CREATED',
  "estimatedDeliveryAt" TIMESTAMP(3),
  "shippedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CourierShipment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ShipmentEvent" (
  "id" TEXT NOT NULL,
  "shipmentId" TEXT NOT NULL,
  "status" "ShipmentStatus" NOT NULL,
  "description" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShipmentEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourierShipment_sellerOrderId_key" ON "CourierShipment"("sellerOrderId");
CREATE INDEX "CourierShipment_status_updatedAt_idx" ON "CourierShipment"("status", "updatedAt");
CREATE INDEX "CourierShipment_courierName_trackingNumber_idx" ON "CourierShipment"("courierName", "trackingNumber");
CREATE INDEX "ShipmentEvent_shipmentId_occurredAt_idx" ON "ShipmentEvent"("shipmentId", "occurredAt");

ALTER TABLE "CourierShipment" ADD CONSTRAINT "CourierShipment_sellerOrderId_fkey"
FOREIGN KEY ("sellerOrderId") REFERENCES "SellerOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShipmentEvent" ADD CONSTRAINT "ShipmentEvent_shipmentId_fkey"
FOREIGN KEY ("shipmentId") REFERENCES "CourierShipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
