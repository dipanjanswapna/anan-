import type { Metadata } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const bengali = Noto_Sans_Bengali({ subsets: ["bengali"], variable: "--font-bengali", display: "swap" });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://anan.com";
const siteName = "ANAN";
const defaultTitle = "ANAN — Everyday shopping, made delightful";
const defaultDescription = "Discover thoughtful finds across fashion, electronics, beauty, home and more on ANAN, Bangladesh online marketplace.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: defaultTitle, template: "%s | ANAN" },
  description: defaultDescription,
  applicationName: siteName,
  category: "shopping",
  alternates: { canonical: "/", languages: { "en-BD": "/", "bn-BD": "/", "x-default": "/" } },
  openGraph: { title: defaultTitle, description: defaultDescription, url: "/", siteName, locale: "en_BD", alternateLocale: ["bn_BD"], type: "website" },
  twitter: { card: "summary_large_image", title: defaultTitle, description: defaultDescription, creator: "@anan" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
};

const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ANAN",
  url: siteUrl,
};
const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ANAN",
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: siteUrl + "/products?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};
const safeJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${bengali.variable}`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationStructuredData) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteStructuredData) }} />
        {children}
      </body>
    </html>
  );
}
