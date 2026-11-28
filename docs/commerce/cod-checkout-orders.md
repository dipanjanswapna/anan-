# COD checkout, orders and stock reservation

## Customer API

- `POST /api/v1/customers/me/checkout` with `{ "addressId": "...", "idempotencyKey": "..." }`.
- `GET /api/v1/customers/me/orders` lists only the authenticated customer's orders.
- `GET /api/v1/customers/me/orders/:id` returns an order only when it belongs to that customer.

The Next.js same-origin proxy reads the HttpOnly `anan_session` cookie. Browser code never receives the raw session token.

## Order and inventory rules

- Checkout accepts only a saved address owned by the signed-in customer.
- The server reloads cart lines, approved product/seller/category state, current prices and stock. Client-supplied totals are never accepted.
- One parent order is created and split into one seller order per seller. Product names and unit prices are snapshotted in integer paisa.
- Stock is decremented with a conditional database update inside the same SERIALIZABLE transaction as order creation. Any failed stock check rolls back the whole order and all stock updates.
- An idempotency key unique to the customer prevents duplicate orders on retry. Successful retries return the original order.
- The cart is cleared only after successful order creation.
- COD is the only payment method. Payment starts as UNPAID.
- Orders start at PENDING_SELLER_ACCEPTANCE; seller acceptance, fulfilment, courier booking, delivery tracking, cancellation/restock and Admin workflows are not yet exposed.

## Delivery pricing limitation

Delivery fee rules and courier integrations are not configured. This development increment currently stores and charges ৳0 delivery fee and returns an explicit warning. Do not enable production checkout until seller-wise delivery pricing, serviceability checks, courier integration and customer-visible final charges are implemented and reviewed.

## Database rollout

The schema adds Order, SellerOrder and OrderItem, including foreign keys, idempotency uniqueness and seller/order indexes. A versioned SQL migration is included. Review it against a production backup and apply through the deployment migration process; do not use Prisma `db push` in production.

## Not included

Online payments, seller order dashboard/actions, Admin order monitoring, delivery fee calculation, courier labels, refunds, customer cancellation, inventory ledger/reservation expiry and production deployment remain follow-up work.
