import React from 'react'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

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
  manifest: '/manifest.json',
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
