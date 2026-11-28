# Customer profile and address book

Customer profile and delivery-address APIs require the opaque customer session issued by OTP sign-in. The Next.js same-origin proxy reads the HttpOnly `anan_session` cookie and forwards it as a bearer token; browser JavaScript never receives the raw token.

## API

- `GET /api/v1/customers/me`: minimal profile (id, name, email, verified phone and account creation date).
- `PATCH /api/v1/customers/me`: update name and/or email. Changing email clears `emailVerifiedAt`; email verification is a separate future flow.
- `GET /api/v1/customers/me/addresses`: list the signed-in customer's addresses.
- `POST /api/v1/customers/me/addresses`: add a Bangladesh delivery address.
- `PATCH /api/v1/customers/me/addresses/:id`: update an owned address.
- `DELETE /api/v1/customers/me/addresses/:id`: delete an owned address and select a replacement default when available.

All address reads and writes are scoped to the authenticated customer. A customer cannot access another customer's address by changing an ID. The first saved address becomes default; setting another address as default clears the previous default in a transaction.

## Data and rollout

PostgreSQL adds `User.name` and `CustomerAddress` with division, district, upazila, area, address line, recipient, phone, postal code and default flag. Local Docker development applies the schema using Prisma `db push`. Production must use a reviewed, versioned Prisma migration and a backup/rollback plan; do not use `db push` as the production migration strategy.

The current UI accepts the Bangladesh administrative-area names as text. A normalized, centrally maintained 64-district/upazila directory and searchable selectors are a follow-up increment. Email verification, address geocoding, and checkout integration are also future work.
