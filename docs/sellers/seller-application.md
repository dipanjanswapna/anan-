# Seller application workflow

## Local flow

1. Open `/sell` in the Next.js storefront.
2. Submit contact name, email, Bangladesh phone number, store name, business category, and optional business details.
3. Next.js forwards the request server-side to `POST /api/v1/seller-applications`.
4. NestJS validates the payload and creates a `SellerApplication` row with `PENDING` status.
5. Duplicate email or phone values return HTTP 409.

## Important boundaries

- An application is not a seller account and does not create a login session.
- Applications are not automatically approved. No product listing or seller storefront access is granted.
- The current API intentionally exposes create-only functionality; there is no public application listing or status lookup.
- Before public launch, implement rate limiting and abuse protection, email/mobile OTP verification, secure Admin authentication and RBAC, and an audited review/approval workflow.
- Identity/NID collection and verification must use a dedicated secure process, not this public form.
- The new Prisma model is applied automatically only by the disposable local Docker Compose setup. Staging and production must use reviewed, committed Prisma migrations.
