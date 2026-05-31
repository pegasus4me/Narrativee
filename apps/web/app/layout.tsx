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
  title: "Narrativee | Turn newsletters into native social content",
  description: "Narrativee learns your voice and repurposes newsletters into platform-native content workflows.",
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
