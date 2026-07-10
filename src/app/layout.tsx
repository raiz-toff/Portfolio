import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Devanagari } from "next/font/google";
import { Provider } from "@/components/docs/provider";
import { Analytics } from "@vercel/analytics/next";
import { author, siteUrl } from "@/lib/shared";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Devanagari face for the राजकुमार logotype (Helvetica has no Devanagari glyphs).
const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "700"],
});

const description =
  "Network engineer in Toronto. CCNA & CCST certified. " +
  "Built from the board up — labs every day in Proxmox, EVE-NG, and Cisco CML.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Rajkumar Neupane — Network Engineer",
    template: "%s · Rajkumar Neupane",
  },
  description,
  authors: [{ name: author.name, url: author.url }],
  creator: author.name,
  openGraph: {
    type: "website",
    siteName: "Rajkumar Neupane",
    title: "Rajkumar Neupane — Network Engineer",
    description,
    images: [
      {
        url: "/social.png",
        width: 2848,
        height: 1504,
        alt: "RN monogram built from the 8 twisted-pair conductors in T568B order — Rajkumar Neupane, Network Engineer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rajkumar Neupane — Network Engineer",
    description,
    images: "/social.png",
  },
  alternates: {
    types: { "application/rss+xml": "/rss.xml" },
  },
  // app/favicon.ico covers the classic path; these add the sharp variants.
  // The svg is scheme-aware (its tile swaps dark via an embedded media query).
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${notoDevanagari.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* RootProvider's next-themes reads the same localStorage "theme" key
            the old inline script wrote, so saved preferences carry over. */}
        <Provider>{children}</Provider>
        <Analytics />
      </body>
    </html>
  );
}
