import type { Metadata } from "next";
import localFont from "next/font/local";
import {
  Instrument_Sans,
  Manrope,
  Stack_Sans_Notch,
  Belleza,
} from "next/font/google";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { Toaster } from "sonner";
import "./globals.css";
import { PostHogProvider } from "./components/providers/PostHogProvider";
import { QueryProvider } from "./components/providers/QueryProvider";

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const stackSans = Stack_Sans_Notch({
  subsets: ["latin"],
  variable: "--font-stack",
});

const belleza = Belleza({
  subsets: ["latin"],
  variable: "--font-belleza",
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://narrativee.com"),
  title: {
    default: "Narrativee | AI Brand Designer for Social Media & Ads",
    template: "%s | Narrativee",
  },
  description:
    "Work with your AI brand designer on recurring social and ad creative. Bring your brand and a brief, then refine editable assets. Join the early-access waitlist.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://narrativee.com",
    siteName: "Narrativee",
    images: [
      {
        url: "/social-preview.png",
        width: 1200,
        height: 630,
        alt: "Narrativee — Your AI brand designer for social media and ads.",
      },
    ],
    title: "Narrativee | AI Brand Designer for Social Media & Ads",
    description:
      "An AI brand designer alongside your team. Create editable social and ad creative using your brand and saved preferences. Join the early-access waitlist.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Narrativee | AI Brand Designer for Social Media & Ads",
    description:
      "Your AI brand designer for recurring social and ad creative. Bring your brand and the next brief. Join the early-access waitlist.",
    images: ["/social-preview.png"],
  },
};

/** Global providers and metadata shared by every application route. */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactNode {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('theme')==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){}`,
          }}
        />
      </head>
      <body
        className={`${geistMono.variable} ${instrumentSans.variable} ${manrope.variable} ${stackSans.variable} ${belleza.variable}`}
        suppressHydrationWarning
      >
        <GoogleTagManager gtmId="GTM-5BCN3HMQ" />
        <GoogleAnalytics gaId="G-L8W7KEVHQ4" />
        <QueryProvider>
          <PostHogProvider>
            {children}
            <Toaster />
          </PostHogProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
