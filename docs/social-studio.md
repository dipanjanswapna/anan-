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
