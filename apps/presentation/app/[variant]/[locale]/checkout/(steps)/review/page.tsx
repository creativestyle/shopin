import { initRouteContext } from '@/lib/request-context/route-context'
import { ensureCheckoutStep } from '@/features/checkout/checkout-server-guard'
import { CheckoutRouteGuard } from '@/features/checkout/checkout-route-guard'
import { CheckoutStepsFrame } from '@/features/checkout/checkout-steps-frame'
import { ReviewActive } from '@/features/checkout/checkout-review-active'

export default async function Page({
  params,
}: {
  params: Promise<{ variant: string; locale: string }>
}) {
  const { variant, locale } = await params
  initRouteContext({ variant, locale })

  await ensureCheckoutStep('review')

  return (
    <CheckoutRouteGuard currentStepId='review'>
      <CheckoutStepsFrame currentStepId='review'>
        <ReviewActive />
      </CheckoutStepsFrame>
    </CheckoutRouteGuard>
  )
}
