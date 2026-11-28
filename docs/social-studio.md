# ANAN Social Studio — Initial Implementation

## Scope in this increment
- Creator profile creation/update for authenticated CUSTOMER and SELLER accounts.
- Public creator profile and storefront route at `/social/creators/[handle]`.
- Single IMAGE or VIDEO post drafts using an HTTPS media URL.
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
