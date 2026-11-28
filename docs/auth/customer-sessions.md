# Customer session management

Customer OTP verification creates a 30-day opaque session. PostgreSQL stores only the SHA-256 token hash. The Next.js proxy stores the raw token in an HttpOnly, SameSite=Lax cookie (Secure in production).

## Endpoints

- `GET /api/v1/auth/session`: validates the bearer session and returns a minimal customer profile (id, phone, email, createdAt) and expiry. Updates last-used time.
- `POST /api/v1/auth/logout`: revokes the current bearer session. The browser proxy clears its HttpOnly cookie.
- Browser proxy: `GET /api/auth/otp/session` and `POST /api/auth/otp/logout`.

The browser must never read or store the raw token in JavaScript. The API endpoints are intended to be called by the trusted same-origin Next.js proxy. Production rollout still requires reviewed Prisma migrations, CSRF/origin review, rate limits for session endpoints, and real SMS delivery configuration. This increment does not yet provide editing of profile fields or management of other devices.
