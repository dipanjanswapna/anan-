# Customer Order Cancellation & Audit Trail

## Customer cancellation
- Authenticated customers can cancel an order only while its parent order is `PENDING_SELLER_ACCEPTANCE` and every seller sub-order is `PENDING_ACCEPTANCE`.
- The API scopes the order lookup to the authenticated customer; another customer's order ID cannot be used to cancel an order.
- Cancellation, seller-order status changes, stock restoration, and the audit event are committed in one PostgreSQL SERIALIZABLE transaction.
- Repeated cancellation requests are idempotent: an already-cancelled order returns a replay response and does not restore inventory again.
- Orders already accepted or otherwise progressed require customer support; no self-service cancellation is allowed after seller acceptance.
- Customer UI only shows the cancellation action while the order is pending seller acceptance.

## API
- `POST /api/v1/customers/me/orders/:id/cancel`
- Same-origin web proxy: `POST /api/account/me/orders/:id`

## Audit data
`OrderEvent` records the order, actor user ID/role, event type, optional note/metadata and timestamp. Current event: `CUSTOMER_CANCELLED`.

## Operational notes
- The migration `20261128010000_order_cancellation_audit` creates the audit table and foreign key/indexes.
- Apply reviewed versioned migrations in production; do not use Prisma `db push` against production.
- This feature does not implement post-acceptance returns/refunds, seller-initiated rejection, or admin overrides.
