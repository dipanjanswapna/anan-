# Admin Return and Dispute Review

## Access control

- `GET /api/v1/admin/returns?status=REQUESTED` lists return requests, customer and seller context, order items, payment method/status, and current decision/refund metadata.
- `PATCH /api/v1/admin/returns/:id/review` accepts `APPROVE`, `REJECT`, `ITEM_RECEIVED`, or `REFUNDED`.
- ADMIN users can review returns. STAFF users require the explicit `RETURNS_REVIEW` AdminPermission.
- Every decision writes an OrderEvent and AdminAuditLog record. Admin notes are limited to 1,500 characters.

## State transitions

- REQUESTED or REJECTED -> APPROVED / REJECTED (Admin can override a seller rejection).
- APPROVED -> ITEM_RECEIVED.
- ITEM_RECEIVED -> REFUNDED only with a positive refund amount in paisa, supported payout method, external transaction reference, and explicit manual-refund confirmation.
- Invalid transitions are rejected; refund amount cannot exceed the seller order item subtotal.

## Manual refund boundary

The refund action does not send money, call bKash/Nagad/Rocket/bank APIs, or alter the parent order payment status. It records an administrator's assertion that an external payout has already completed, with reference, method, amount and audit metadata. Admin must verify transaction evidence before confirming. Provider integrations and automated refund reconciliation are not implemented.

## Operations

- Migration: `20261128070000_admin_return_review`.
- Apply migrations through the controlled production migration pipeline before deploying code that reads the new fields.
- Courier reverse pickup and evidence/photo uploads are not part of this increment.
