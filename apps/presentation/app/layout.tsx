import React from 'react'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { I18N_CONFIG, urlPrefixToRfc } from '@config/constants'
import { getLocale } from 'next-intl/server'
import { QueryProvider } from './query-provider'
import { DM_Sans } from 'next/font/google'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const prefix = await getLocale()
  const lang = prefix ? urlPrefixToRfc(prefix) : I18N_CONFIG.defaultLocale
  return (
    <html
      lang={lang}
      className={dmSans.variable}
    >
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}

export const dynamic = 'force-dynamic'

const siteTitle = 'SHOPin - E-commerce Platform'
const siteDescription =
  'Modern e-commerce platform with a comprehensive design system'

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.FRONTEND_URL ?? 'https://localhost:3000'),
  title: {
    default: siteTitle,
    template: '%s | SHOPin',
  },
  description: siteDescription,
  keywords: ['e-commerce', 'shopping'],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'SHOPin',
    title: siteTitle,
    description: siteDescription,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'SHOPin' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: ['/og-image.png'],
  },
}
