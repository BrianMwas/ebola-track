import type { Metadata } from "next"
import { Geist, Geist_Mono, DM_Sans } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SiteBanner } from "@/components/site-banner"
import { en } from "@/lib/strings"
import { cn } from "@/lib/utils";

const dmSansHeading = DM_Sans({subsets:['latin'],variable:'--font-heading'});

const geist = Geist({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

// Private preview: no indexing and no social cards until INRB/INSP agree to
// publication (see PUBLIC_LAUNCH_BLOCKED in the README).
export const metadata: Metadata = {
  title: `${en.appName} (${en.privatePreview.toLowerCase()})`,
  description: en.appTagline,
  robots: { index: false, follow: false },
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
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable, dmSansHeading.variable)}
    >
      <body>
        <ThemeProvider>
          <SiteBanner />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
