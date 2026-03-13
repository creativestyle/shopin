import React from 'react'
import { CheckoutHeader } from '@/features/checkout/checkout-header'
import { CheckoutFooter } from '@/features/checkout/checkout-footer'

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='flex min-h-screen flex-col bg-gray-50'>
      <CheckoutHeader />
      <main className='flex flex-1 flex-col'>{children}</main>
      <CheckoutFooter />
    </div>
  )
}
