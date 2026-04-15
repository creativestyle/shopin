import React from 'react'
import { CheckoutHeader } from '@/features/checkout/checkout-header'
import { CheckoutFooter } from '@/features/checkout/checkout-footer'
import { PageShell, PageContent } from '@/components/layout/page-shell'

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PageShell className='bg-gray-50'>
      <CheckoutHeader />
      <PageContent className='flex flex-col'>{children}</PageContent>
      <CheckoutFooter />
    </PageShell>
  )
}
