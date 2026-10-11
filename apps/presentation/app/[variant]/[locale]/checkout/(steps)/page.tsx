import { initRouteContext } from '@/lib/request-context/route-context'
import { ensureCheckoutEntry } from '@/features/checkout/checkout-server-guard'
import { CheckoutEntryClient } from './checkout-entry-client'

export default async function Page({
  params,
}: {
  params: Promise<{ variant: string; locale: string }>
}) {
  const { variant, locale } = await params
  initRouteContext({ variant, locale })

  await ensureCheckoutEntry()

  return <CheckoutEntryClient />
}
