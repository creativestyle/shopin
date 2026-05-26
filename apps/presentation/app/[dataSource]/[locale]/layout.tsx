import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { DM_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import { AddToCartModalProvider } from '@/features/cart/cart-add-to-cart-modal-provider'
import { StoreConfigProvider } from '@/features/store-config/store-config-provider'
import { getStoreConfig } from '@/features/store-config/get-store-config-server'
import { TopBar } from '@/components/layout/top-bar'
import { getHeaderLayout } from '@/features/content/get-layout'
import { QueryProvider } from '../../query-provider'
import { DemoDisclaimerModalWrapper } from './demo-disclaimer-modal-wrapper'
import {
  listLocales,
  urlPrefixToRfc,
  PRODUCT_IMAGE_HOSTS,
  CONTENT_IMAGE_API_HOSTS,
  type DataSource,
} from '@config/constants'
import { setRequestDataSource } from '@/lib/request-context/data-source'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const revalidate = 3600

export default async function LocaleLayout({
  params,
  children,
}: {
  params: Promise<{ dataSource: DataSource; locale: string }>
  children: ReactNode
}) {
  const { dataSource, locale } = await params
  setRequestDataSource(dataSource)
  setRequestLocale(locale)

  if (!listLocales().some((l) => l.urlPrefix === locale)) {
    notFound()
  }

  const [messages, storeConfig, headerLayout] = await Promise.all([
    getMessages(),
    getStoreConfig(),
    getHeaderLayout(),
  ])

  return (
    <html
      lang={urlPrefixToRfc(locale)}
      className={dmSans.variable}
    >
      <head>
        {[...PRODUCT_IMAGE_HOSTS, ...CONTENT_IMAGE_API_HOSTS].map((host) => (
          <link
            key={host}
            rel='preconnect'
            href={`https://${host}`}
          />
        ))}
      </head>
      <body>
        <QueryProvider>
          <NextIntlClientProvider
            locale={locale}
            messages={messages}
            key={locale}
          >
            <StoreConfigProvider storeConfig={storeConfig}>
              <AddToCartModalProvider>
                <TopBar messages={headerLayout?.topBarMessages ?? []} />
                <div className='container-type-inline-size flex min-h-screen flex-col'>
                  {children}
                </div>
                <Toaster position='bottom-right' />
                <DemoDisclaimerModalWrapper />
              </AddToCartModalProvider>
            </StoreConfigProvider>
          </NextIntlClientProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
