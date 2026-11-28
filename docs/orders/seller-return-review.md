# Seller Return Review

The seller workspace lists return requests associated only with the authenticated seller's own seller orders.

## API

- `GET /api/v1/sellers/me/returns` lists up to 100 newest requests, scoped to the approved seller profile.
- `PATCH /api/v1/sellers/me/returns/:id` accepts `{ "decision": "APPROVED" | "REJECTED", "notes"?: string }`.
- Notes are limited to 1,000 characters. Only a request in `REQUESTED` status for a delivered seller order can be reviewed.
- The decision and note are written to the order event audit trail.
- Seller rejection creates an Admin notification for follow-up.

## Seller UI

The Seller Centre includes a Return requests section with customer contact, reason, customer details, order items, decision notes, and Approve/Reject actions.

## Scope and safeguards

- Seller approval records the decision only. It does not create a reverse pickup, restock items, change payment status, or issue a refund.
- Rejections are flagged for Admin oversight; an Admin dispute/final-review workflow is a separate next step.
- All list and review operations are scoped by the authenticated seller profile; a seller cannot review another seller's request.
- The return-request endpoint is intentionally one-way from `REQUESTED`; repeated decisions are rejected as conflicts.
