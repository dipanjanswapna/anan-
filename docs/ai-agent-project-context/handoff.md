# Session Handoff — Premium Storefront, Auth & Responsive Pass

> Honest status: code is written, typechecked, built and exercised in a real browser against a local PostgreSQL + API. Nothing is deployed, the migration chain still cannot build a fresh database, and the work is unmerged.

## Scope delivered

**Homepage & hero**
- New `HeroCarousel`: 3 data-driven slides (copy, CTA, image), 6.5 s autoplay, hover/focus pause, play/pause control, arrows, dots + counter, touch swipe, arrow-key support, `prefers-reduced-motion`, fixed slide min-heights (no layout shift), mobile scrim so copy stays readable over the image.
- `app/page.tsx` rebuilt: hero, trust strip, category grid using real catalogue counts, featured grid, deals rail (`onSale`), promo banners, more-to-discover rail, store directory, buyer-guide strip and footer. Empty catalogue renders a “catalogue is being prepared” state instead of fake products.

**Product cards & detail**
- `catalog-product-card`: real price/compare-at, discount %, stock state, seller store name, wishlist toggle, quick view, add-to-cart — all through `lib/product-actions.ts` with an `anan:cart-updated` event so the header badge updates without a reload.
- `QuickViewDialog`: focus-trapped dialog, image, price, stock, seller, quantity, add-to-cart, link to full detail.
- Product detail: `product-gallery` (thumbnails, hover zoom, lightbox, keyboard), `product-purchase-actions` (quantity, add, buy now, wishlist, mobile sticky bar), breadcrumb, save/stock states, delivery/returns copy, seller panel, honest reviews empty state (no invented ratings), related products fallback, recently viewed.

**Auth**
- Shared `auth-layout`, `customer-auth-form` (sign in / sign up / admin): phone validation, OTP request + resend countdown, terms acknowledgement, profile update after signup, accessible errors.
- New pages `/login`, `/signup`, `/admin/login`, `/admin` (operations index).
- Backend: `OtpPurpose.ADMIN_LOGIN` and ADMIN/STAFF eligibility in `otp.service` (append-only migration `20261128120000_admin_login`), so staff can sign in without a password.
- Seller sign-in form now normalises local numbers (`017…`, `880…`, `1…`) to E.164 before requesting/verifying, and rejects malformed numbers up front. Before this fix a local-format number silently matched no seller and no code was sent.

**Cart, checkout, account**
- Cart: line images, quantity steppers, remove, move to wishlist, per-line stock warnings, order summary, real empty state.
- Checkout: three steps (delivery → payment → review), saved-address selection plus inline address creation, COD only, stable idempotency key per attempt, honest “delivery pricing is not configured, ৳0” note, confirmation redirect with `?placed=1`.
- Account dashboard (orders/wishlist/addresses/delivered stats, recent orders, profile, addresses, sign out), orders list with track/cancel, wishlist page, order confirmation banner in tracking.
- Header: item-count badge, cart event refresh, full mobile drawer with Esc/scroll lock.

**Seller & Admin UI**
- Seller dashboard/products pages reviewed at tablet and desktop; live data, status pills, search/filter tabs, per-product actions and public-page links render correctly.
- Admin products console: counts (Awaiting/Live/Rejected/Drafts/Archived), tabs, search, audit copy; approval of a pending product with an approved image was executed end to end (see evidence).
- Admin dashboard (`/admin`) lists operational areas with permission-gated links.

## Verification evidence

| Check | Result |
|---|---|
| Web `tsc --noEmit` / API `tsc --noEmit` | Passed (0 errors) |
| `nest build` / `next build` | Passed; all routes compiled |
| Signup with real OTP (local stub), profile persisted | Passed — `/account` shows the new name/email |
| Add to cart, badge, quantity 1→2, total ৳2,490→৳4,980 | Passed |
| Checkout address creation, COD review, place order | Passed — order `cmx0coekr…` with `?placed=1` confirmation |
| Wishlist save → wishlist page → add to cart | Passed (“Saved to your wishlist.”, item rendered, add-to-cart from wishlist) |
| Product filters `/products?category=fashion&sort=price_asc` | Passed — 3 live items in ascending price order |
| Orders page / account stats | Passed — order visible as “Pending Seller Acceptance”, 1 order / 1 address |
| Quick view dialog (open, add-to-cart, Escape close) | Passed |
| Mobile menu at 375px (open, links, no overflow) | Passed |
| Seller OTP sign-in → `/seller/dashboard`, `/seller/products` | Passed (2 live products, statuses and actions correct) |
| Admin OTP sign-in → `/admin`, `/admin/products` | Passed (Live count 11 after approval) |
| Admin approval of pending product with approved image | Passed — API 200, status `APPROVED`, appears in `/catalog/products?search=Linen` |
| Responsive audit 320/375/430/768/1024/1440/1920 × homepage, catalogue, detail, login, signup (35 checks) | No page `scrollWidth > innerWidth`; only clipped off-screen carousel slides flagged, as intended |
| Responsive audit 320/375/768/1024/1440 × cart, checkout, account, wishlist, orders (25 checks) | No horizontal overflow and no offending elements |

Screenshots for the review are in `artifacts/` (untracked, review-only; see `.gitignore`).

## Not done / limitations

- **Fresh-database migration is broken (P0):** `prisma migrate deploy` fails on an empty DB (`relation "User" does not exist`) because the chain has no baseline migration. Local DB was built with `db push` and the migrations marked applied. See `known_issues.md`.
- Seller product **create/edit/image upload** UI was not exercised; only list/dashboard rendering and the approval path were.
- No automated unit/integration/E2E tests were added; all evidence above is manual.
- No formal accessibility audit (keyboard paths and focus styles were exercised, not audited against WCAG).
- No variants, colours, sizes, reviews/ratings, coupons, customer notifications or newsletter — the schema does not support them, so the UI shows honest empty/disabled states instead of invented data.
- Delivery pricing is not configured; checkout states ৳0 explicitly rather than faking a fee.
- Order cancellation and return flows were not re-tested this session.

## Local reproduction (used for the evidence above)

- PostgreSQL 19 portable build on `127.0.0.1:5433`, database `anan_dev`, `prisma db push` + the two lifecycle migrations marked applied.
- `apps/api/.env` (gitignored): local `OTP_HASH_SECRET`, `OTP_DELIVERY_URL` pointing at a throwaway OTP stub that prints codes to `/tmp/otp.log`, `MEDIA_PUBLIC_BASE_URL` for placeholder images.
- Web on `0.0.0.0:3000`, API on `127.0.0.1:4000`, browser preview through the workspace hostname.
- Fixtures (not committed): 10 approved products, 2 approved sellers, admin `+8801999999999`, customer `+8801812345678`.

## Best next tasks

1. Fix the migration baseline and replay the whole chain on disposable PostgreSQL in CI.
2. Exercise seller product create → image upload → submit → admin approve → public listing in the browser.
3. Add integration tests for cart totals, checkout idempotency, order cancellation and admin review permissions.
4. Add MFA and permission management for Admin accounts; add resend/attempt metrics for OTP abuse controls.
5. Replace placeholder catalogue imagery with real seller uploads and DTO-driven media URLs.


## Follow-up handoff — 2026-11-28 (after PR #34)

- Current main HEAD: `6aad3fb40eeb89270c494ccd4b5d593e3df99bca`.
- PR #34 S3 SigV4 correction is merged. Latest-head CI run `46154036981` passed Prisma validation/client generation, API build, Web typecheck/build, Compose validation and development image build.
- The S3 correction has not been tested against a real private bucket. Do not claim live PUT/HEAD success.
- Social Studio is merged, but upload is still quarantine-only. There is no scanner, file decode/re-encode, EXIF stripping, video validation/transcoding, approved-object promotion or proven private delivery. The Admin guard intentionally prevents publishing a quarantine URL. Keep quarantine private and 18+ disabled.
- P0: migration history starts with `20261128000000_customer_orders`, which references foundational `User`, `SellerProfile`, and `Product` tables without creating them. No earlier baseline migration exists.
- A safety runbook was added at `docs/database/migration-baseline-remediation.md`. It deliberately does not prescribe destructive commands against real environments. First inventory every environment's migration history, reconstruct the historical pre-order schema, review SQL, then test empty-DB replay and existing-DB adoption on disposable/backup copies.
- No database was reset, migrated or marked applied in this follow-up. No production environment was modified.
- Next task: use a local workspace with pnpm/Prisma/PostgreSQL to reconstruct and generate the historically correct foundational migration, then add a disposable-PostgreSQL CI migration replay. Do not fabricate the SQL from today's full schema: later migrations already create many current models/columns and would conflict.
