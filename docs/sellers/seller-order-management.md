# Seller order management

## Seller authentication

- Sellers sign in with the existing OTP delivery integration using `SELLER_PHONE_VERIFICATION`.
- Session creation is allowed only when the phone belongs to an active `SELLER` user with an `APPROVED` `SellerProfile`.
- Sessions store only a SHA-256 token hash in PostgreSQL; the browser receives an HttpOnly, SameSite=Lax cookie through the Next.js route.
- Seller APIs independently validate the bearer session, active user, seller role, and approved seller profile. Every order query is scoped to that seller profile.
- Seller applications do not automatically create seller accounts. An approved seller account must be provisioned and linked to a verified phone by an authorized operational/admin process before login is possible.

## Order workflow

- Checkout creates each seller order with a 24-hour `acceptanceDeadlineAt`.
- Existing pending seller orders receive a deadline based on their original `createdAt` during migration.
- Sellers can view only their own recent seller orders and can accept or reject only orders in `PENDING_ACCEPTANCE`.
- Rejection restores the seller order's product quantities in the same SERIALIZABLE transaction and writes an `OrderEvent`.
- Accepting after the deadline marks that seller order `CANCELLED`, restores stock, and records an acceptance-timeout audit event.
- When every seller order is resolved, the parent order becomes `PROCESSING` if any seller accepted, or `CANCELLED` if all seller orders were rejected/cancelled.

## Endpoints

- `GET /api/v1/sellers/me/dashboard`
- `POST /api/v1/sellers/me/orders/:id/accept`
- `POST /api/v1/sellers/me/orders/:id/reject`

The web app exposes these through the same-origin `/api/seller/*` proxy. No public seller-order endpoint is provided.

## Operational notes

- Configure a real SMS provider through the existing `OTP_DELIVERY_URL` and `OTP_DELIVERY_TOKEN` integration before enabling seller login.
- The current deadline is enforced when a seller attempts acceptance; a scheduled background worker for proactively expiring untouched orders and notifying Admin is a separate follow-up.
- Apply the versioned migration with the reviewed production migration process. This change does not deploy or migrate AWS production infrastructure.
