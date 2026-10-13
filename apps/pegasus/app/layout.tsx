import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";

const mono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "safoan.inc — Building Pegasus",
  description:
    "Building Pegasus, an independent software lab. Narrativee is the first product and the current focus.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={mono.variable}>{children}</body>
    </html>
  );
}
