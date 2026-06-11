import type { Metadata } from "next";
import localFont from "next/font/local";
import { Urbanist, Manrope, Instrument_Sans, JetBrains_Mono } from 'next/font/google'
import { GoogleTagManager } from '@next/third-parties/google'
import { GoogleAnalytics } from '@next/third-parties/google'
import "./globals.css";
import { Toaster } from "sonner";
import { PostHogProvider } from "./components/providers/PostHogProvider";
import { QueryProvider } from "./components/providers/QueryProvider";
import ScreenSizeGuard  from "./components/workspace/ScreenSizeGuard";
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

const instrumentSans = Instrument_Sans({ 
  subsets: ["latin"],
  variable: '--font-instrument'
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--font-jetbrains'
});

export const metadata: Metadata = {
  metadataBase: new URL("https://narrativee.com"),
  title: {
    default: "Narrativee | AI Content Repurposing Tool for Social Media",
    template: "%s | Narrativee",
  },
  description: "Narrativee is the premium AI content repurposing tool. Automatically repurpose Substack, beehiiv, and RSS newsletters into posts for LinkedIn, X, and Threads.",
  keywords: [
    "content repurposing tool",
    "repurposing content for social media",
    "newsletter repurposing",
    "substack growth",
    "social media distribution",
    "ai voice cloner",
    "newsletter promotion"
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://narrativee.com",
    siteName: "Narrativee",
    title: "Narrativee | AI Content Repurposing Tool for Social Media",
    description: "Narrativee is the premium AI content repurposing tool. Automatically repurpose Substack, beehiiv, and RSS newsletters into posts for LinkedIn, X, and Threads.",
    images: [
      {
        url: "/og-image-v2.png",
        width: 1200,
        height: 630,
        alt: "Narrativee Platform - AI Content Repurposing System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Narrativee | AI Content Repurposing Tool for Social Media",
    description: "Narrativee is the premium AI content repurposing tool. Automatically repurpose Substack, beehiiv, and RSS newsletters into posts for LinkedIn, X, and Threads.",
    images: ["/og-image-v2.png"],
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
        className={`${urbanist.variable} ${manrope.variable} ${geistMono.variable} ${instrumentSans.variable} ${jetbrainsMono.variable}`}
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
