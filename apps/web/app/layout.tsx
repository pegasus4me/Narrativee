import type { Metadata } from "next";
import localFont from "next/font/local";
import { Urbanist, Manrope } from 'next/font/google'
import { GoogleTagManager } from '@next/third-parties/google'
import { GoogleAnalytics } from '@next/third-parties/google'
import "./globals.css";
import { Toaster } from "sonner";
import { PostHogProvider } from "./components/providers/PostHogProvider";
import { QueryProvider } from "./components/providers/QueryProvider";
import ScreenSizeGuard  from "./components/workspace/ScreenSizeGuard";
import { setupMockFetch } from "@/lib/mock-fetch";

if (typeof window !== "undefined") {
  setupMockFetch();
}
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

const urbanist = Urbanist({
  variable: "--font-urbanist",
  weight: ["400", '500', '600', '700', '800', '900'],
  subsets: ['latin']
})

const manrope = Manrope({
  variable: "--font-manrope",
  weight: ["400", '500', '600', '700', '800'],
  subsets: ['latin']
})

export const metadata: Metadata = {
  metadataBase: new URL("https://narrativee.com"),
  title: {
    default: "Narrativee | Turn Newsletters into Native Social Content",
    template: "%s | Narrativee",
  },
  description: "Narrativee learns your unique writing voice, extracts high-performing angles from your newsletters, and compiles platform-native content workflows for LinkedIn, X, Threads, and more.",
  keywords: [
    "newsletter repurposing",
    "substack growth",
    "social media distribution",
    "ai voice cloner",
    "newsletter promotion",
    "content repurposing tool"
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://narrativee.com",
    siteName: "Narrativee",
    title: "Narrativee | Turn Newsletters into Native Social Content",
    description: "Repurpose your newsletter automatically into channel-native posts that match your voice and drive growth.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Narrativee Platform - Newsletter Repurposing System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Narrativee | Turn Newsletters into Native Social Content",
    description: "Repurpose your newsletter automatically into channel-native posts that match your voice and drive growth.",
    images: ["/og-image.png"],
    creator: "@narrativee",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${urbanist.variable} ${manrope.variable} ${geistMono.variable}`}
        suppressHydrationWarning
      >
        <GoogleTagManager gtmId="GTM-5BCN3HMQ" />
        <GoogleAnalytics gaId="G-L8W7KEVHQ4" />
        <QueryProvider>
          <PostHogProvider>
            <ScreenSizeGuard>
              {children}
            </ScreenSizeGuard>
            <Toaster />
          </PostHogProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
