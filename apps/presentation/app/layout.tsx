import React from 'react'
import type { Metadata, Viewport } from 'next'
import { SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/site-metadata'
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
    template: `%s | ${SITE_NAME}`,
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
    siteName: SITE_NAME,
    title: siteTitle,
    description: siteDescription,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: [DEFAULT_OG_IMAGE.url],
  },
}
