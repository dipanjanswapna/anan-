# Web UI/UX Foundation

> Scope: the Next.js storefront in `apps/web`. This document describes the shared design primitives, the public route map, and the UI states every page is expected to provide. It does not claim visual or browser QA — see "Verification status" at the end.

## Design direction

ANAN keeps a calm, mobile-first retail feel: generous white space, soft lavender surfaces, one strong purple brand colour and small, confident type. Bilingual content is shown as a primary English line with an optional Bangla line, never as a language toggle that does not exist yet.

| Token | Value | Use |
|---|---|---|
| Brand primary | `brand-600` `#7434df` | Primary actions, active filters, links |
| Brand surface | `brand-50` `#f5f0ff` | Selected chips, icon tiles, quiet panels |
| Ink | `#201936` / `#302344` | Headings and body copy |
| Muted text | `#8f849e` / `#a097ad` | Secondary copy and metadata |
| Page background | `#fcfbfe` | Public listing pages |
| Border | `#eeeaf3` | Cards and dividers |
| Radius | `rounded-2xl` / `rounded-3xl` | Cards and hero panels |
| Shadow | `shadow-soft` | Hover lift only, never static noise |

Typography uses Inter with Noto Sans Bengali as the fallback, both loaded through `next/font` in `src/app/layout.tsx`.

## Shared primitives

- `components/site-header.tsx` — sticky header, search, category nav, cart count from the signed-in cart, mobile menu that closes on navigation.
- `components/site-footer.tsx` — single footer used by all public pages; only links to routes that exist.
- `components/catalog-product-card.tsx` — real catalogue card: approved image or placeholder, discount badge from compare-at price, out-of-stock overlay, seller line.
- `components/product-card.tsx` — editorial marketing card used on the home page.
- `components/product-gallery.tsx` — accessible multi-image gallery with thumbnail buttons and `aria-current`.
- `components/seller-nav.tsx` — shared Seller Centre navigation with sign-out.
- `lib/format.ts` — `formatTaka`, `takaToPaisa`, `paisaToTakaInput`, `formatDate`, `formatDateTime`, `prettyStatus`, `discountPercent`.
- `globals.css` — focus-visible rings, skip link, `.field-label` / `.field-input` / `.badge` helpers and reduced-motion handling.

## Route map (storefront)

| Route | Purpose | Data source |
|---|---|---|
| `/` | Editorial home, category entry points, featured marketing cards | Static marketing content |
| `/products` | Catalogue with search, category, price range, stock, sale and sort filters plus pagination | `GET /catalog/products` |
| `/products/[slug]` | Product detail with gallery, seller card, add to cart / wishlist | `GET /catalog/products/:slug` |
| `/categories` | Category directory with live product counts | `GET /catalog/categories` |
| `/categories/[slug]` | Category landing with product grid | `GET /catalog/products?category=` |
| `/deals` | Products with a seller-set compare-at price | `GET /catalog/products?onSale=true` |
| `/stores` | Approved-seller directory | `GET /catalog/stores` |
| `/stores/[storeSlug]` | Storefront with approved products | `GET /catalog/stores/:storeSlug` |
| `/help` | Help centre: shopping, delivery, payment, returns, privacy, contact | Static, aligned with current capability |
| `/cart`, `/wishlist`, `/checkout`, `/orders`, `/orders/[id]`, `/account`, `/login` | Customer commerce (pre-existing) | Customer API proxies |
| `/sell` | Seller application landing (pre-existing) | `POST /seller-applications` |

Seller Centre: `/seller/dashboard`, `/seller/products`, `/seller/products/new`, `/seller/products/[productId]`, `/seller/products/[productId]/images`.
Admin console: `/admin/products`, `/admin/product-images`, `/admin/orders`, `/admin/returns`, `/admin/notifications`, `/admin/seller-applications`.

## Required states

Every data-backed surface must render four states:

1. **Loading** — a short, plain-language message; skeleton placeholders are acceptable but must not shift focus.
2. **Empty** — explains what is missing and offers the next useful action (for example "Clear filters" or "Add your first product").
3. **Error** — inline, actionable, and never a raw stack trace. API proxies return `503` with a safe message when the upstream is unavailable.
4. **Success** — only after the API confirms; optimistic success is not allowed for orders, reviews or money.

## Accessibility conventions

- A skip link targets `#content` around the app shell.
- Interactive elements use `aria-label`, `aria-expanded`, `aria-pressed` or `aria-current` where the visual state changes.
- Focus rings are always visible for keyboard users and suppressed only for pointer focus.
- Filters are real forms or links, so they work without JavaScript and can be bookmarked.
- Images carry seller-authored alt text; decorative glyphs are `aria-hidden`.
- Motion respects `prefers-reduced-motion`.

## Honest content rules

Copy must match implemented behaviour: cash on delivery only, no online payments, seller-entered courier tracking, manual refund records, product and image approval required. Do not describe planned features (2FA, coupons, payouts, live carrier feeds) as available.

## Verification status

- `pnpm --filter @anan/web typecheck` — passed.
- `pnpm --filter @anan/web build` — passed; all routes compiled.
- No browser click-through, screenshot review or assistive-technology pass was performed. Treat layout and interaction polish as **unverified visually** until reviewed on the preview environment.

## Premium storefront pass (this session)

- `components/hero-carousel.tsx` — three-slide data-driven hero: 6.5s autoplay, pause on hover/focus, play/pause, arrows, dots with counter, touch swipe, arrow keys, reduced-motion fallback, fixed slide heights and a mobile scrim.
- `components/catalog-product-card.tsx`, `product-rail.tsx`, `quick-view-dialog.tsx`, `lib/product-actions.ts` — one card system for grids and rails with wishlist, quick view, add-to-cart and a shared `anan:cart-updated` event.
- `components/product-gallery.tsx`, `product-purchase-actions.tsx`, `recently-viewed.tsx` — gallery with thumbnails/zoom/lightbox, quantity and buy-now actions, mobile sticky purchase bar.
- `components/auth-layout.tsx`, `customer-auth-form.tsx` — shared sign-in/sign-up/admin shell; `/signup`, `/admin/login` and `/admin` added.
- `site-header.tsx`, `customer-cart.tsx`, `customer-checkout.tsx`, `customer-account.tsx`, `customer-orders.tsx`, `customer-wishlist.tsx` — badge refresh, full mobile drawer, cart line controls, three-step checkout, account dashboard.
- Responsive result: 60 checks at 320/375/430/768/1024/1440/1920px across public and authenticated pages reported no horizontal overflow; the only flagged elements are intentionally clipped off-screen carousel slides.
- Copy policy: no invented ratings, reviews, brands, coupons or delivery fees; unsupported features show honest empty/disabled states.
