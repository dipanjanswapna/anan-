# Customer accounts and sessions

After a valid CUSTOMER_LOGIN or CUSTOMER_SIGNUP OTP, ANAN creates or reuses a customer account and issues a random 256-bit opaque session token. Only its SHA-256 hash is stored in PostgreSQL. Sessions expire after 30 days and can be revoked server-side.

The Next.js OTP proxy stores the token in an HttpOnly, SameSite=Lax cookie (Secure in production) and never returns the raw token to browser JavaScript. The NestJS API response contains the token for trusted first-party clients; never log it.

The account bootstrap is passwordless and keyed by a verified Bangladesh mobile number. Existing non-customer accounts cannot be converted by customer OTP. Disabled accounts cannot sign in.

This increment issues sessions but does not yet expose profile/session introspection or logout endpoints. Those endpoints, device/session management UI, CSRF review, IP/device throttling, and provider-specific SMS integration are follow-up work. Production requires reviewed Prisma migrations and a unique OTP_HASH_SECRET.
