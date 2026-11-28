# Customer cart and wishlist

Customer cart and wishlist endpoints require an active CUSTOMER session. The Next.js same-origin account proxy reads the HttpOnly `anan_session` cookie and forwards a bearer token; browser JavaScript never receives the raw token.

## API

- `GET /api/v1/customers/me/cart`: current customer's cart, item quantities, current product prices, availability and subtotal in paisa.
- `POST /api/v1/customers/me/cart/items/:productId`: add a quantity (1–99) or increase the existing quantity.
- `PATCH /api/v1/customers/me/cart/items/:productId`: set the line quantity (1–99).
- `DELETE /api/v1/customers/me/cart/items/:productId`: remove a cart line.
- `GET /api/v1/customers/me/wishlist`: list saved, currently public products.
- `POST /api/v1/customers/me/wishlist/:productId`: save an approved product (idempotent).
- `DELETE /api/v1/customers/me/wishlist/:productId`: remove a saved product.

## Rules

- Every read and mutation is scoped to the authenticated customer.
- Only products from approved sellers, in active categories, with APPROVED product status can be added.
- Cart add/update checks live stock in a serializable database transaction. A cart is not a stock reservation; stock is checked again during checkout and order placement.
- Prices are read from the current product record and all monetary values remain integer paisa/BigInt. The subtotal is informational and is not an order total.
- Cart and wishlist rows are unique by customer and product. Deleting a customer or product cascades its related rows.
- Products that are no longer public are excluded from the cart/wishlist display. Out-of-stock lines remain visible in cart with an availability warning.

## Database and rollout

PostgreSQL adds `CartItem` and `WishlistItem` with customer/product foreign keys, unique compound constraints and lookup indexes. Local Docker development applies the schema using Prisma `db push`. Production must use a reviewed, versioned Prisma migration with backup and rollback planning; never use `db push` as the production migration strategy.

Checkout, delivery charges, coupon application, inventory reservation, order creation and payment are intentionally not enabled in this increment.
