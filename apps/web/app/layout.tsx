import type { Metadata } from "next";
import localFont from "next/font/local";
import { Instrument_Sans, Manrope, Stack_Sans_Notch, Belleza } from "next/font/google";
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
    default: "Narrativee | Your AI Brand Designer",
    template: "%s | Narrativee",
  },
  description:
    "Meet your AI brand designer. Explore identities, campaigns and creative assets with an agent that learns your brand over time. Join the early-access waitlist.",
  alternates: { canonical: "/" },
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
