import React from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'
import { Toaster } from 'sonner'
import { AddToCartModalProvider } from '@/features/cart/cart-add-to-cart-modal-provider'
import { StoreConfigProvider } from '@/features/store-config/store-config-provider'
import { getStoreConfig } from '@/features/store-config/get-store-config-server'
import { TopBar } from '@/components/layout/top-bar'
import { getHeaderLayout } from '@/features/content/get-layout'

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [prefix, messages, storeConfig, headerLayout] = await Promise.all([
    getLocale(),
    getMessages(),
    getStoreConfig(),
    getHeaderLayout(),
  ])

  return (
    <NextIntlClientProvider
      locale={prefix}
      messages={messages}
      key={prefix}
    >
      <StoreConfigProvider storeConfig={storeConfig}>
        <AddToCartModalProvider>
          <TopBar messages={headerLayout?.topBarMessages ?? []} />
          <main>{children}</main>
          <Toaster position='bottom-right' />
        </AddToCartModalProvider>
      </StoreConfigProvider>
    </NextIntlClientProvider>
  )
}
