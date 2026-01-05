import type { Metadata } from "next";
import localFont from "next/font/local";
import { Urbanist, Manrope } from 'next/font/google'
import { GoogleTagManager } from '@next/third-parties/google'
import { GoogleAnalytics } from '@next/third-parties/google'
import FeedbackPopup from "./components/commons/FeedbackPopup";
import {NarrativeeProvider} from "./sdk-test/NarrativeeProvider";
import "./globals.css";

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
  title: "Narrativee",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${urbanist.variable} ${manrope.variable} ${geistMono.variable}`}>
        <GoogleTagManager gtmId="GTM-5BCN3HMQ" />
        <GoogleAnalytics gaId="G-L8W7KEVHQ4" />
        <NarrativeeProvider apiKey="nr-live-11eaf097-2cb0-4e3b-9e38-d61b131d1620">
          {children}
        </NarrativeeProvider>
        <FeedbackPopup />
      </body>
    </html>
  );
}
