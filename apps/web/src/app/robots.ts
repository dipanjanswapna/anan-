import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://anan.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: "*",
      allow: ["/", "/products", "/categories", "/stores", "/sell"],
      disallow: ["/api/", "/account", "/admin", "/cart", "/checkout", "/login", "/seller", "/wishlist", "/orders"],
    }],
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: siteUrl,
  };
}
