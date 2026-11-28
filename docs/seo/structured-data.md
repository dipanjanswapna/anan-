# Structured data

ANAN emits JSON-LD using Schema.org vocabulary:

- Root layout: `Organization` and `WebSite`, including the catalogue search action.
- Product detail pages: `Product` with a current `Offer` (BDT price, stock availability, new condition and seller organization).
- Product detail pages: `BreadcrumbList` from Home to the product.

## Data integrity

- Prices are generated from integer paisa using BigInt arithmetic; no floating-point conversion is used.
- Availability reflects the public catalog stock value at page-render time and can change.
- No ratings, reviews, GTIN, brand, shipping rates or return policy are fabricated.
- JSON-LD is serialized with the less-than character escaped before insertion into the document.
- Product media is not yet part of the catalog model/UI. Add a verified absolute product image URL to Product schema when product image management is implemented; image is important for eligibility for Google's product rich results.

## Validation before launch

1. Use Schema Markup Validator and Google's Rich Results Test on deployed product URLs.
2. Confirm schema price matches the visible product price and currency is BDT.
3. Confirm stock status after inventory changes.
4. Re-test after adding product images, seller identity and localized routes.
5. Set `NEXT_PUBLIC_SITE_URL` to the owned production HTTPS domain.
