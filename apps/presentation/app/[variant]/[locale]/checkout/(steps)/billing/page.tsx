import { initRouteContext } from '@/lib/request-context/route-context'
import { CheckoutStepPage } from '../checkout-step-page'
import { BillingActive } from '@/features/checkout/checkout-billing-active'

export default async function Page({
  params,
}: {
  params: Promise<{ variant: string; locale: string }>
}) {
  const { variant, locale } = await params
  initRouteContext({ variant, locale })

  return (
    <CheckoutStepPage stepId='billing'>
      <BillingActive />
    </CheckoutStepPage>
  )
}
