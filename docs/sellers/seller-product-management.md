# Seller Product Management & Admin Product Review

> Adds the missing seller product list/create/edit workflow and the Admin approval step that makes a product publishable. All endpoints live under the existing `/api/v1` prefix.

## Ownership and permissions

- Seller endpoints require an approved seller session (`role = SELLER`, `sellerProfile.status = APPROVED`). The seller is derived from the session token; a client-supplied seller id is never trusted.
- Every read and write is scoped by `sellerId` in the query, so a seller cannot view or modify another store's product.
- Admin endpoints require `role = ADMIN`, or `STAFF` with the `PRODUCT_REVIEW` permission row in `AdminPermission`.
- Review actions write an `AdminAuditLog` row (`PRODUCT_APPROVED` / `PRODUCT_REJECTED`).

## Lifecycle

```
(create) → DRAFT → submit → PENDING_APPROVAL → Admin approve → APPROVED (public)
                                  ↘ Admin reject → REJECTED → edit → DRAFT → submit …
DRAFT | APPROVED | REJECTED → archive → ARCHIVED → restore → DRAFT
```

Rules enforced in `seller-products.service.ts`:

- Submitting requires at least one uploaded image.
- Only `DRAFT` and `REJECTED` products can be submitted; only `PENDING_APPROVAL` products can be reviewed.
- Archived products cannot be edited until restored.
- Editing a `REJECTED` product moves it back to `DRAFT` and clears the previous review note.
- Editing an `APPROVED` product keeps it live (price/stock/copy corrections do not delist a listing). This is a deliberate trade-off and is documented as an open risk: there is no re-review gate for live edits.
- Price must be at least ৳1 (100 paisa). A compare-at price must be strictly higher than the price or omitted.
- Categories must exist and be active.
- The slug is generated once from the English name and stays stable, so public URLs do not break when copy changes.

## API contract

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/sellers/me/products?status=&search=&page=&limit=` | List own products with status counts and pagination |
| `POST` | `/sellers/me/products` | Create a `DRAFT` product |
| `GET` | `/sellers/me/products/:productId` | Read own product with images |
| `PATCH` | `/sellers/me/products/:productId` | Update own product |
| `POST` | `/sellers/me/products/:productId/submit` | Submit a draft/rejected product for review |
| `POST` | `/sellers/me/products/:productId/archive` | Archive a product (delists it) |
| `POST` | `/sellers/me/products/:productId/restore` | Restore an archived product as a draft |
| `GET` | `/admin/products?status=&search=&page=&limit=` | Review queue; defaults to `PENDING_APPROVAL` |
| `PATCH` | `/admin/products/:productId/review` | `{ action: "APPROVE" \| "REJECT", notes? }` |

Request body for create/update (all money in integer paisa):

```json
{
  "nameEn": "Handwoven cotton throw",
  "nameBn": "হাতে বোনা সুতির চাদর",
  "categoryId": "clx…",
  "descriptionEn": "…",
  "descriptionBn": "…",
  "pricePaisa": 185000,
  "compareAtPricePaisa": 220000,
  "stockOnHand": 12
}
```

`PATCH` accepts any subset. Send `compareAtPricePaisa: null` to clear a markdown; send an empty string for `nameBn` / descriptions to clear them.

Responses return `{ product, message }` where `product.pricePaisa` and `compareAtPricePaisa` are decimal strings (BigInt is never serialized as a number).

## Web surface

- `/seller/products` — status counts, filters, search, images, submit/archive/restore, rejection notes.
- `/seller/products/new` — create form with live summary and review checklist.
- `/seller/products/[productId]` — edit form, listing status panel, public link, image summary, lifecycle actions.
- `/seller/products/[productId]/images` — existing upload + Admin image moderation flow (unchanged).
- `/admin/products` — review queue with image preview, approve, and reject-with-reason.

Proxies: `apps/web/src/app/api/seller/[...path]/route.ts`, `apps/web/src/app/api/admin/products/route.ts`, `apps/web/src/app/api/admin/products/[id]/review/route.ts`. Raw session tokens stay in the HttpOnly cookie and are never exposed to browser JavaScript.

## Database

`apps/api/prisma/migrations/20261128090000_seller_product_lifecycle/migration.sql` adds:

- `Product.reviewNotes` — the Admin note shown to the seller after a rejection.
- `Product.reviewedAt` — when the last review decision was made.

The migration is append-only and has **not** been applied to any environment in this session.

## Known limitations

- Live (`APPROVED`) product edits are not re-reviewed.
- No hard delete; archiving is the only removal path.
- No bulk actions, CSV import or variant/SKU model.
- Image processing, malware scanning and EXIF stripping remain outstanding (see `known_issues.md`).
- Product approval does not require an *approved* image, only an uploaded one; the public page shows a placeholder until an image passes review.

## Verification status

- `prisma generate` — passed.
- `pnpm --filter @anan/api typecheck` — passed.
- `pnpm --filter @anan/api build` — passed (`nest build`).
- Migration execution against PostgreSQL, endpoint integration tests and E2E seller/admin flows were **not** run.
