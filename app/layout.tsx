import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Liquidation Watch - Real-Time Crypto Liquidation Tracker",
  description:
    "Monitor real-time cryptocurrency liquidations across major exchanges. Track whale liquidations, analyze market trends, and get insights into crypto market movements.",
  keywords: [
    "crypto liquidations",
    "liquidation tracker",
    "whale alerts",
    "cryptocurrency",
    "trading",
    "binance liquidations",
    "bybit liquidations",
    "okx liquidations",
    "crypto market analysis",
    "liquidation watch",
  ],
  authors: [{ name: "Liquidation Watch Team" }],
  creator: "Liquidation Watch",
  publisher: "Liquidation Watch",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://liquidationwatch.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Liquidation Watch - Real-Time Crypto Liquidation Tracker",
    description:
      "Monitor real-time cryptocurrency liquidations across major exchanges. Track whale liquidations and analyze market trends.",
    url: "https://liquidationwatch.com",
    siteName: "Liquidation Watch",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Liquidation Watch - Real-Time Crypto Liquidation Tracker",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Liquidation Watch - Real-Time Crypto Liquidation Tracker",
    description: "Monitor real-time cryptocurrency liquidations across major exchanges.",
    images: ["/og-image.png"],
    creator: "@liquidationwatch",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Liquidation Watch",
              description: "Real-time cryptocurrency liquidation tracker and market analysis platform",
              url: "https://liquidationwatch.com",
              applicationCategory: "FinanceApplication",
              operatingSystem: "Web Browser",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              author: {
                "@type": "Organization",
                name: "Liquidation Watch Team",
              },
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
