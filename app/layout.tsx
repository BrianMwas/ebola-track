import type { Metadata } from "next"
import Script from "next/script"
import { Geist_Mono, Karla, Quicksand } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { en } from "@/lib/strings"
import { cn } from "@/lib/utils";

// Titles: Quicksand. Body text: Karla. Both are variable fonts, so every weight is available.
const fontHeading = Quicksand({ subsets: ["latin"], variable: "--font-heading" })

const fontSans = Karla({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const GA_ID = "G-BBJRG25NL3"

// Link previews need absolute image URLs. Set NEXT_PUBLIC_SITE_URL at build
// time to the deployed origin (e.g. https://ebola-track.example.workers.dev).
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

const trackAnalytics = process.env.NODE_ENV === "production" && !!process.env.NEXT_PUBLIC_SITE_URL

const title = en.appName

// The preview image comes from app/opengraph-image.tsx; icons from app/icon.svg,
// app/favicon.ico and app/apple-icon.png.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description: en.appTagline,
  openGraph: {
    type: "website",
    url: "/",
    siteName: en.appName,
    title,
    description: en.appTagline,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: en.appTagline,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", "font-sans", fontSans.variable, fontHeading.variable, fontMono.variable)}
    >
      <body>
        {/* Analytics only on the production site: not in dev, previews or other hosts. */}
        {trackAnalytics && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`if (location.origin === ${JSON.stringify(new URL(siteUrl).origin)}) {
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');
}`}
            </Script>
          </>
        )}
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
