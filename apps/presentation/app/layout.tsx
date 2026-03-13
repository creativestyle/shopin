import React from 'react'
import type { Metadata } from 'next'
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
  const lang = prefix ? urlPrefixToRfc(prefix) : I18N_CONFIG.defaultLanguage
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

export const metadata: Metadata = {
  title: 'SHOPin - E-commerce Platform',
  description: 'Modern e-commerce platform with a comprehensive design system',
}
