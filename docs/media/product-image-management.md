# Product image management

## Workflow

1. An authenticated, approved seller requests a short-lived (5-minute) S3 PUT URL for a product they own.
2. The API creates an unpredictable object key under `products/{sellerId}/{productId}/` and signs the URL with AWS Signature Version 4.
3. The browser uploads directly to S3; image bytes do not pass through the NestJS API.
4. The seller calls the completion endpoint. The API performs a signed S3 HEAD request and checks the stored content type and exact byte count against the upload request.
5. The image is stored as `PENDING` and is not returned by the public catalogue.
6. Admin/authorized staff review the image. Approval makes it visible to catalogue APIs and product JSON-LD; rejection requires a reason.
7. Up to 8 image records per product; JPEG, PNG, WebP and AVIF; maximum 10 MiB per image; alt text required.

## API

- `POST /api/v1/sellers/me/products/:productId/images/upload` — body: `{ "contentType": "image/webp", "sizeBytes": 12345, "altText": "..." }`; returns a signed PUT URL, storage key and expiry.
- Browser sends `PUT` to the returned URL with the matching `Content-Type` header and file bytes.
- `POST /api/v1/sellers/me/products/:productId/images/complete` — body: `{ "storageKey": "...", "contentType": "...", "sizeBytes": 12345, "altText": "..." }`.
- `GET /api/v1/sellers/me/products/:productId/images` — seller's own image moderation state.
- `GET /api/v1/admin/product-images?status=PENDING` — Admin review queue.
- `PATCH /api/v1/admin/product-images/:id/review` — body: `{ "action": "APPROVE" }` or `{ "action": "REJECT", "notes": "..." }`.

The web UI is at `/seller/products/{productId}/images` and `/admin/product-images`.

## Required configuration

Set the following in the API runtime (never commit credentials):

- `AWS_REGION`
- `AWS_S3_BUCKET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `MEDIA_PUBLIC_BASE_URL` — preferably the HTTPS CloudFront distribution URL. Leave empty only when the S3 object URL is intentionally public.

Create a dedicated IAM principal/role restricted to `s3:PutObject` and `s3:GetObject` on the bucket prefix `products/*`. Do not grant bucket-wide administration, delete, ACL, or public-policy permissions to the application role.

Configure S3 CORS to allow the exact storefront origin, method `PUT`, and header `Content-Type`. Do not use wildcard origins in production. Configure CloudFront OAC and a private bucket for public delivery; set `MEDIA_PUBLIC_BASE_URL` to the distribution origin.

## Production hardening still required

- The API verifies S3 object existence, MIME metadata and size, but does not decode pixels, enforce image dimensions, strip EXIF, scan malware, or re-encode images. Add an isolated image-processing pipeline (e.g. SQS + Lambda/container) before production launch.
- Add a lifecycle rule for incomplete/unclaimed uploads and a cleanup job for rejected assets.
- Add rate limits and per-seller storage quotas.
- Grant STAFF the `PRODUCT_MEDIA_REVIEW` permission explicitly through the future RBAC administration UI.
- Add image ordering/primary-image controls and product creation/editing UI.
- Run the migration in a reviewed deployment before enabling uploads.
