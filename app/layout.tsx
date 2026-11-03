import type { Metadata } from "next"
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
      className={cn("antialiased", "font-sans", fontSans.variable, fontHeading.variable, fontMono.variable)}
    >
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
