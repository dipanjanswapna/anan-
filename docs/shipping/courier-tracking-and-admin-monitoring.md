# Courier tracking and Admin order monitoring

## Seller shipment management

An approved seller can create or update courier tracking after accepting a seller order:
- `POST /api/v1/sellers/me/orders/:id/shipment`
- Body: `courierName`, `trackingNumber`, optional HTTPS `trackingUrl`, optional ISO `estimatedDeliveryAt`.

Seller shipment status updates:
- `PATCH /api/v1/sellers/me/orders/:id/shipment/status`
- Status: `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `DELIVERY_FAILED`, `RETURNED`.
- Each status change creates a shipment event and an order audit event. Shipment movement updates the seller order and parent order delivery status.

## Customer tracking

The authenticated customer order-detail endpoint now includes each seller order's shipment and chronological tracking events. It remains scoped to the owning customer.

## Admin order monitoring

- `GET /api/v1/admin/orders?status=SHIPPED`
- Requires an active ADMIN or STAFF session.
- Returns order status counts, latest 100 orders, customer contact, seller orders, courier details and recent shipment events.

## Scope and limitations

This is a manual courier tracking foundation. No courier carrier API/webhook is connected, so status updates are entered by the seller. Carrier credentials, webhook signature verification, reconciliation, delivery proof, customer-facing tracking UI, and production migrations remain separate work. Do not treat a seller-entered status as carrier-verified proof of delivery.
