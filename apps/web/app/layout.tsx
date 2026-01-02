import type { Metadata } from "next";
import localFont from "next/font/local";
import { Urbanist, Manrope } from 'next/font/google'
import { GoogleTagManager } from '@next/third-parties/google'
import { GoogleAnalytics } from '@next/third-parties/google'
import FeedbackPopup from "./components/commons/FeedbackPopup";

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
        {children}
        <FeedbackPopup />
      </body>
    </html>
  );
}
