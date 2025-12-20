import type { Metadata } from "next";
import localFont from "next/font/local";
import { Story_Script, Petrona, DM_Mono, Noto_Sans, Urbanist } from 'next/font/google'
import { GoogleTagManager } from '@next/third-parties/google'
import { GoogleAnalytics } from '@next/third-parties/google'
import FeedbackPopup from "./components/FeedbackPopup";

import "./globals.css";

const story = Story_Script({
  variable: "--font-story",
  weight: ["400"]
})
const dmMono = DM_Mono({
  variable: "--font-mono",
  weight: ["400"]
})
const urbanist = Urbanist({
  variable: "--font-urbanist",
  weight: ["400", '500', '600', '700', '800', '900'],
  subsets: ['latin']
})
const noto = Noto_Sans({
  variable: "--font-noto",
  weight: ["400"],
  subsets: ['latin']
})
const petrona = Petrona({
  variable: "--font-petrona",
  subsets: ["latin"],
})
export const metadata: Metadata = {
  title: "Narrativee - Turn Excel Data into Narrative Reports",
  description: "Automated data storytelling tool. Convert spreadsheets (Excel/CSV) into detailed narrative reports in seconds. AI data reporting without the hassle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${petrona.variable} ${dmMono.variable} ${story.variable} ${noto.variable} ${urbanist.variable}`}>
        <GoogleTagManager gtmId="GTM-5BCN3HMQ" />
        <GoogleAnalytics gaId="G-L8W7KEVHQ4" />
        {children}
        <FeedbackPopup />
      </body>
    </html>
  );
}
