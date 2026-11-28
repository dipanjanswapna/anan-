# Automatic seller-order expiry and admin notifications

The API runs a background polling worker in each application process. It checks for seller orders whose 24-hour acceptance deadline has elapsed and whose status is still `PENDING_ACCEPTANCE`.

For each eligible seller order, a serializable database transaction:
- re-checks the deadline and status to avoid duplicate expiry work;
- restores the ordered quantities to product stock;
- marks the seller order `CANCELLED` and appends a `SYSTEM` order event;
- updates the parent order once every seller order has left pending acceptance; and
- writes a deduplicated admin notification.

The poll interval is configurable with `ORDER_EXPIRY_POLL_INTERVAL_MS` (10,000–3,600,000; default 60,000). Each process prevents overlapping local sweeps. Database state checks and a unique notification dedupe key protect repeated polling and competing workers. For production, run a single worker deployment or retain these database guards when horizontally scaling.

## Admin notifications API

All routes require a live ADMIN or STAFF session:
- `GET /api/v1/admin/notifications` — unread count and latest 50 notifications.
- `PATCH /api/v1/admin/notifications/:id/read` — mark a notification as read.

This creates the persistence and API foundation; a dedicated Admin notification UI, email/SMS escalation, and a distributed queue/lease are separate follow-ups.
