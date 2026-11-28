# Customer return requests

Customers can request a return for an individual seller order after it reaches `DELIVERED`.

- Endpoint: `POST /api/v1/customers/me/orders/seller-orders/:sellerOrderId/returns`
- Reasons: `DAMAGED`, `WRONG_ITEM`, `MISSING_PARTS`, `NOT_AS_DESCRIBED`, `OTHER`.
- Optional details are limited to 1,500 characters.
- The default request window is 7 days after courier delivery timestamp (or seller-order update timestamp when no delivery timestamp exists). Configure `RETURN_REQUEST_WINDOW_DAYS` from 1 to 30.
- One return request is allowed per seller order. The operation is customer-scoped and serializable.
- Submission creates an order audit event and is visible in customer order tracking.

This is the request-intake stage only. Seller review actions, evidence upload, pickup/return logistics, admin dispute resolution and refunds are not yet implemented. COD refunds require an approved MFS payout process; the request itself never triggers a payment.
