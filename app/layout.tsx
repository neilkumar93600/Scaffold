import type { Metadata } from 'next'
import { Geist, Geist_Mono, Figtree, Merriweather } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";

const merriweatherHeading = Merriweather({subsets:['latin'],variable:'--font-heading'});

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: {
    default: 'Next.js SaaS Boilerplate & Launch OS | Scaffold',
    template: '%s | Scaffold',
  },
  description: 'Stop rebuilding from scratch. Scaffold is the ultimate Next.js SaaS boilerplate with 120+ UI templates, Supabase auth, and Inngest. Ship smarter today. ✓',
  keywords: ['Next.js SaaS boilerplate', 'Next.js Supabase starter kit', 'React launch OS', 'Next.js', 'SaaS template'],
  authors: [{ name: 'Neil' }],
  creator: 'Gary Soft',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://scaffold.dev',
    title: 'Scaffold | Your Ultimate Launch OS',
    description: 'Stop rebuilding from scratch. Ship smarter, every time.',
    siteName: 'Scaffold',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scaffold | Your Ultimate Launch OS',
    description: 'Stop rebuilding from scratch. Ship smarter, every time.',
    creator: '@garysoft',
  },
  metadataBase: new URL('https://scaffold.dev'),
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
      className={cn("antialiased", fontMono.variable, "font-sans", figtree.variable, merriweatherHeading.variable)}
    >
      <body className="dark">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
