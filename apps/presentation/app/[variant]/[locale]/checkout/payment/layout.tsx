import type { ReactNode } from 'react'
import { initRouteContext } from '@/lib/request-context/route-context'
import { CheckoutHeader } from '@/features/checkout/checkout-header'
import { CheckoutFooter } from '@/features/checkout/checkout-footer'
import { PageShell, PageContent } from '@/components/layout/page-shell'

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ variant: string; locale: string }>
  children: ReactNode
}) {
  const { variant, locale } = await params
  initRouteContext({ variant, locale })

  return (
    <PageShell className='bg-gray-50'>
      <CheckoutHeader />
      <PageContent className='flex flex-col'>{children}</PageContent>
      <CheckoutFooter />
    </PageShell>
  )
}
