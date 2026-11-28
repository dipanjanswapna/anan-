# Admin seller application review

## API
All endpoints require a live first-party bearer session (stored token is SHA-256 hashed).

- `GET /api/v1/admin/seller-applications?status=PENDING`
- `PATCH /api/v1/admin/seller-applications/:id/review`

Body: `{ "action": "UNDER_REVIEW", "notes": "Please provide identity documents" }`
Actions: `UNDER_REVIEW`, `APPROVED`, `REJECTED`. Notes are optional, maximum 2,000 characters.

## Authorization
- `ADMIN` has access.
- `STAFF` requires the explicit `SELLER_APPLICATIONS_REVIEW` row in `AdminPermission`.
- Customer and seller sessions are denied.
- Admin/staff accounts and sessions must be provisioned by a trusted operator. No public admin bootstrap endpoint is provided.
- Permission grants must be performed through a privileged operational process.

## Approval and identity
Approval provisions a `SELLER` user and approved `SellerProfile` in one serializable transaction. Existing customer/account collisions are rejected; identities are never silently merged or converted. Seller phone OTP verification is still required before seller login. NID/KYC collection and review are not part of this workflow.

## Audit and deployment
Each transition creates an `AdminAuditLog` row. Never store OTPs, session tokens, NID data, or secrets in notes/audit metadata. Apply the versioned migration through the reviewed production migration process; this change does not run a production migration.
