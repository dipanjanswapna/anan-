# Customer OTP foundation

## Endpoints

- `POST /api/v1/auth/otp/request` — accepts an E.164 Bangladesh phone number and an OTP purpose.
- `POST /api/v1/auth/otp/verify` — verifies a six-digit code for the latest unconsumed challenge.

## Controls

- Six-digit codes generated with Node's cryptographic random generator.
- HMAC-SHA256 code digests; raw codes are never stored.
- Five-minute expiry, 60-second resend cooldown, three requests per 15 minutes, and five verification attempts.
- Atomic attempt increments and one-time challenge consumption.
- SMS delivery is an adapter contract configured with `OTP_DELIVERY_URL` and `OTP_DELIVERY_TOKEN`; no provider is selected or credentials committed.

## Local configuration

Set a random `OTP_HASH_SECRET` of at least 32 characters in the API environment. Configure an SMS adapter endpoint and token before requesting codes. The adapter must accept JSON `{ "to": "+880...", "message": "..." }` with a Bearer token and return a 2xx response.

## Explicit limitations

OTP verification alone does not create a customer account, authenticate a session, or issue a token. Those steps require a subsequent account/session implementation. The login screen therefore reports successful phone verification without claiming the user is signed in. Add IP/device-level throttling, provider-specific delivery integration, monitoring, and tests before production.
