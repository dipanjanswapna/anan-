import type { Metadata } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const bengali = Noto_Sans_Bengali({ subsets: ["bengali"], variable: "--font-bengali", display: "swap" });

export const metadata: Metadata = {
  title: "ANAN — Everyday shopping, made delightful",
  description: "Discover thoughtful finds across fashion, electronics, beauty, home and more on ANAN.",
  applicationName: "ANAN",
  metadataBase: new URL("https://anan.com"),
  openGraph: {
    title: "ANAN — Everyday shopping, made delightful",
    description: "A better way to shop from Bangladesh's growing marketplace.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${bengali.variable}`}>{children}</body>
    </html>
  );
}