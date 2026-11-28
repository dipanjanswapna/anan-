# Seller Earnings, Commission and Payouts

## Seller earnings release

- An Admin (or STAFF with `PAYOUTS_MANAGE`) can release a seller order using `POST /api/v1/admin/seller-finance/seller-orders/:id/release`.
- The seller order must be DELIVERED and have a courier-confirmed `deliveredAt` timestamp.
- The configurable return window (current default: 7 days; bounded to 1–30) must have elapsed.
- An active return request blocks release. A REJECTED return request is treated as resolved; unresolved disputes do not release.
- Each seller order can produce one immutable earning ledger row. Default commission is 10% (1,000 basis points); the rate is stored on SellerProfile and bounded to 0–50% at release.
- Gross is the seller order item subtotal; commission is rounded to the nearest paisa; net is gross less commission. Delivery fee and taxes are not included in this first ledger version.

## Seller payout requests

- `GET /api/v1/sellers/me/finance` returns balances, earnings and payout history.
- `POST /api/v1/sellers/me/finance/payout-requests` requests the full available balance using bKash, Nagad, Rocket or bank transfer destination details.
- A seller can have only one REQUESTED or APPROVED payout at a time. Entries are locked to the request so they cannot be requested twice.
- Seller APIs never return the stored payout destination. Admin finance APIs expose it only to ADMIN or STAFF with `PAYOUTS_MANAGE`.

## Admin payout workflow

- `GET /api/v1/admin/seller-finance/payout-requests?status=REQUESTED` lists requests.
- `PATCH /api/v1/admin/seller-finance/payout-requests/:id` accepts APPROVE, REJECT, or PAID.
- REJECT releases the linked ledger entries back to the seller's available balance.
- PAID is allowed only after approval and requires an external transaction reference; linked earnings are marked PAID.
- Actions are recorded in AdminAuditLog. This workflow does not initiate any MFS or bank transfer; Admin must perform and verify the transfer externally before recording PAID.

## Security and production notes

- STAFF must hold the explicit `PAYOUTS_MANAGE` permission; ADMIN is allowed.
- Payout destination details are sensitive financial data. Production deployment must enforce database encryption at rest, restricted Admin access, access logging, retention policy and appropriate operational verification.
- Commission default and release rules require Finance/Admin sign-off before real transactions. No VAT/tax withholding, split settlements, payment gateway reconciliation or automated payout provider integration is included.
- Migration: `20261128080000_seller_finance_payouts`. Apply through the controlled migration pipeline before deploying the API.
