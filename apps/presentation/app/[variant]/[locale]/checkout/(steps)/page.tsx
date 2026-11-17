import { initRouteContext } from '@/lib/request-context/route-context'
import { ensureCheckoutEntry } from '@/features/checkout/checkout-server-guard'
import { CartHydrationBoundary } from '@/features/cart/cart-hydration-boundary'
import { CheckoutEntryClient } from './checkout-entry-client'

export default async function Page({
  params,
}: {
  params: Promise<{ variant: string; locale: string }>
}) {
  const { variant, locale } = await params
  initRouteContext({ variant, locale })

  const cart = await ensureCheckoutEntry()

  return (
    <CartHydrationBoundary cart={cart}>
      <CheckoutEntryClient />
    </CartHydrationBoundary>
  )
}
