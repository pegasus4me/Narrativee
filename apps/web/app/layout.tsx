import type { Metadata } from "next";
import localFont from "next/font/local";
import { Story_Script, Petrona, DM_Mono, Noto_Sans } from 'next/font/google'

import "./globals.css";

const story = Story_Script({
  variable: "--font-story",
  weight: ["400"]
})
const dmMono = DM_Mono({
  variable: "--font-mono",
  weight: ["400"]
})
const noto = Noto_Sans({
  variable: "--font-noto",
  weight: ["400"],
  subsets: ['latin']
})
const petrona = Petrona({
  variable: "--font-petrona",
  weight: ["400"]
})
export const metadata: Metadata = {
  title: "Narrativee",
  description: "Turn data into narrative & detaileds reports in minutes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${petrona.variable} ${dmMono.variable} ${story.variable} ${noto.variable}`}>
        {children}
      </body>
    </html>
  );
}
