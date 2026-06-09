import { initRouteContext } from '@/lib/request-context/route-context'
import { CheckoutRouteGuard } from '@/features/checkout/checkout-route-guard'
import { CheckoutStepsFrame } from '@/features/checkout/checkout-steps-frame'
import { BillingActive } from '@/features/checkout/checkout-billing-active'

export default async function Page({
  params,
}: {
  params: Promise<{ variant: string; locale: string }>
}) {
  const { variant, locale } = await params
  initRouteContext({ variant, locale })

  return (
    <CheckoutRouteGuard currentStepId='billing'>
      <CheckoutStepsFrame currentStepId='billing'>
        <BillingActive />
      </CheckoutStepsFrame>
    </CheckoutRouteGuard>
  )
}
