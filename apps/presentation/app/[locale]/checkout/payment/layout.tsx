import type { ReactNode } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { CheckoutHeader } from '@/features/checkout/checkout-header'
import { CheckoutFooter } from '@/features/checkout/checkout-footer'
import { PageShell, PageContent } from '@/components/layout/page-shell'

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>
  children: ReactNode
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <PageShell className='bg-gray-50'>
      <CheckoutHeader />
      <PageContent className='flex flex-col'>{children}</PageContent>
      <CheckoutFooter />
    </PageShell>
  )
}
