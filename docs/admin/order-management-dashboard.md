# Admin order management dashboard

The admin console provides a read-only order monitoring view at `/admin/orders`.

- Status totals and filters for pending seller acceptance, processing, shipped, delivered and cancelled orders.
- Parent order totals, customer contact context and seller-level fulfilment summaries.
- Shipment carrier, tracking number, courier link and recent tracking-event count.
- Data is loaded from the authenticated `GET /api/v1/admin/orders` endpoint through the Next.js cookie-backed proxy.
- The dashboard does not mutate orders. Existing customer cancellation, seller acceptance/rejection and shipment workflows remain the only state-changing paths.

Access requires an active ADMIN or STAFF session. Do not expose this page publicly or cache its responses. Carrier event data remains seller-entered until verified courier webhooks are implemented.
