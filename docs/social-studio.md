# ANAN Social Studio — Initial Implementation

## Scope in this increment
- Creator profile creation/update for authenticated CUSTOMER and SELLER accounts.
- Public creator profile and storefront route at `/social/creators/[handle]`.
- Single IMAGE or VIDEO post drafts through controlled direct-to-S3 uploads; external media URLs are disabled.
- Explicit creator submission to moderation; drafts and rejected/pending posts are private to their creator/Admin.
- Admin/Staff moderation queue. ADMIN is allowed; STAFF requires `SOCIAL_MODERATION` permission.
- Public feed returns only PUBLISHED posts.
- Audit log entry for each Admin moderation decision.

## API
- `GET/POST /api/v1/creators/me/profile`
- `GET /api/v1/creators/:handle`
- `GET/POST /api/v1/creators/me/posts`
- `POST /api/v1/creators/me/posts/:id/submit`
- `GET /api/v1/social/posts`
- `GET /api/v1/admin/social/posts`
- `PATCH /api/v1/admin/social/posts/:id/review`

Web proxy routes are under `/api/social` and use the existing HttpOnly `anan_session` cookie pattern. Raw session tokens are not exposed to browser JavaScript.

## Data model
- `CreatorProfile`: one profile per User; unique public handle.
- `SocialPost`: exactly one media type (IMAGE or VIDEO), one HTTPS URL, optional caption, and moderation state.
- Post status transitions: DRAFT → PENDING_REVIEW → PUBLISHED or REJECTED. Public feed/profile queries select PUBLISHED only.
- Migration: `20261128100000_social_studio_creator_foundation`.

## Product constraints
- No carousel, DMs, live commerce or paid sponsored placement.
- No 18+ publishing until genuine age assurance is implemented and reviewed.
- Moderation approval is mandatory for public visibility.

## Explicit limitations / next work
- Media URL only: this increment does not upload media, scan/re-encode files, verify media ownership, or enforce image/video codec and duration limits.
- No likes, comments, reports, block/mute, appeal flow, age assurance, moderation SLA queue, escalation/evidence retention, creator analytics or performance highlights yet.
- Social moderation is a first-pass admin review flow, not a complete Trust & Safety operation.
- No production deployment, migration execution or provider configuration is claimed.


## Trust & Safety increment — implementation in progress
- Users can report a published post once per post; report reasons include spam, harassment, hate, violence, sexual content, misinformation, copyright and other.
- Users can block/unblock a creator. Authenticated feed queries exclude blocked creators.
- Admin/Staff with Social Moderation permission can inspect open reports, dismiss a report, or hide the reported post. Report status changes and Admin audit entries are committed in one database transaction.
- Public feed sends the existing HttpOnly session cookie through the server proxy when present; raw session tokens remain server-side.
- New migration: `20261128113000_social_trust_safety`.
- API additions: `POST /api/v1/social/posts/:id/report`, `POST /api/v1/creators/:handle/block`, `POST /api/v1/creators/:handle/unblock`, `GET /api/v1/admin/social/reports`, `PATCH /api/v1/admin/social/reports/:id/review`.

## Remaining safety and media work
- Report/block controls are a first increment, not a staffed moderation operation. Appeals, evidence retention, escalation, abuse/rate limits and response SLAs remain.
- Blocking currently filters the authenticated public feed; it does not yet hide the creator profile if a user opens its URL directly.
- Controlled upload, file decode/re-encode, malware scan, content classification, media ownership verification and quota enforcement remain.
- Age assurance remains a hard prerequisite before any 18+ content or creator feature is enabled.
- Migration application, database integration tests, UI/browser verification and production rollout have not been claimed.


## Controlled Creator media upload — implementation increment
- Creator requests a short-lived (5-minute) S3 presigned PUT URL through `POST /api/v1/creators/me/posts/upload`; object keys are generated server-side under `social/quarantine/<creator-profile-id>/`.
- Creator browser uploads one file directly to S3, then calls `POST /api/v1/creators/me/posts/complete`. The API verifies the object with signed S3 HEAD and checks exact content type and byte length before creating a DRAFT post.
- Images: JPEG/PNG/WebP up to 10 MiB. Videos: MP4/WebM up to 100 MiB. One media file per post. External HTTPS media URLs are rejected by the legacy draft endpoint.
- Only Admin-approved PUBLISHED posts appear in public feed/storefront queries. Pending drafts remain private to their creator and moderation staff.
- Storage config reuses `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, optional `AWS_SESSION_TOKEN`, and `MEDIA_PUBLIC_BASE_URL`. S3 CORS must allow the exact storefront origin and PUT/Content-Type.
- **Not yet implemented:** malware scanning, media decoding/re-encoding, EXIF removal, codec/duration inspection, video transcoding, content classification, orphan cleanup, quotas/rate limits and a private-origin/CloudFront signed delivery design. File extension/MIME/size and HEAD verification are not a malware or content-safety scan. Configure storage so quarantine objects cannot be browsed publicly; production release requires security review.


## Creator blocking persistence update
- Creator storefront now loads the signed-in viewer's persisted block status from the API and displays Block/Unblock correctly after reload.
- The unblock proxy and API now both use PATCH consistently; a dedicated authenticated block-status endpoint reports the current state.
- Signed-in viewers who have blocked a creator receive a not-found response for that creator storefront; public feed filtering remains in place.
- Anonymous visitors can still view public creator profiles. Block state is private to the viewer.


## Blocked creator management
- `GET /api/social/me/blocks` returns the signed-in viewer's blocked creators.
- The `/social/blocked-creators` page lets the viewer review and unblock creators without reopening their storefront.
- The page is linked from the Social Studio feed. This is a viewer-level content preference, not a platform-wide account ban.


## Backend engagement logic (added 2026-11-28)
- Follow/unfollow uses a unique follower/creator pair; self-follow is rejected. A follow notification is created only for a newly-created relationship.
- Like/unlike uses a unique user/post pair; only published posts from active creators can be liked.
- Comments are created as PENDING_REVIEW. Only PUBLISHED comments are returned publicly; Admin/authorized moderation staff can approve, hide or remove pending comments, with an audit record.
- Save/unsave uses a unique user/post pair. Saved-post retrieval filters out posts that are no longer public.
- Creator stats expose follower count, published post count, aggregate likes and the signed-in viewer's follow state.
- In-app notifications are private to the recipient; marking read is scoped to the authenticated recipient.
- Public creator stats and comments do not expose private account/session data.

### Engagement API routes
- POST /creators/:handle/follow
- PATCH /creators/:handle/unfollow
- GET /creators/:handle/stats
- POST /social/posts/:id/like
- GET /social/posts/:id/comments
- POST /social/posts/:id/comments
- POST /social/posts/:id/save
- GET /social/saved
- GET /social/notifications
- PATCH /social/notifications/:id/read
- GET /admin/social/comments
- PATCH /admin/social/comments/:id/review

### Remaining backend hardening
- Add automated unit/integration tests for concurrency, permissions, moderation transitions, notification privacy and cursor pagination.
- Add per-user/per-IP abuse rate limits and anti-spam controls for follows, likes, reports and comments.
- Add follow-feed ranking and pagination cursor; current feed is latest-first with a bounded page size.
- Add moderation appeals, evidence retention policy, escalation queue and staff workflow.
- Complete secure media quarantine scanning and promotion to private approved delivery storage before production.

## Feed pagination, following feed and abuse throttling (2026-11-28)
- Public feed now returns items and nextCursor and supports limit (1-50) plus post-ID cursor pagination.
- GET /social/feed/following returns only approved posts from followed creators, also cursor-paginated.
- Block relationships are mutual for feed visibility: a viewer's blocked creators and creators who blocked the viewer are excluded.
- Database-backed fixed-minute action buckets throttle authenticated follows (20/min), likes (60/min), comments (8/min) and reports (5/min). Counters increment atomically in PostgreSQL; exceeded requests receive HTTP 429.
- Added SocialRateLimitBucket model and additive migration 20261128140000_social_rate_limits.

### Feed API
- GET /social/posts?limit=20&cursor=postId
- GET /social/feed/following?limit=20&cursor=postId

### Known hardening still required
- Add automated unit/integration tests for rate-limit concurrency, authorization, moderation transitions, notification privacy and pagination.
- Add scheduled retention cleanup for old SocialRateLimitBucket rows.
- Rate limits are per authenticated user, not per IP/device; edge/WAF rate limiting is still required for anonymous traffic and distributed abuse.
- Feed currently uses newest-first chronological order, not recommendation ranking.
- Media remains in quarantine storage without malware scanning, decode/re-encode, EXIF stripping, video transcoding or approved-object promotion. Do not expose quarantine objects publicly.
- Add moderation appeals, evidence retention, escalation queues and operational staffing before launch.