import { setRequestLocale } from 'next-intl/server'
import { CheckoutRouteGuard } from '@/features/checkout/checkout-route-guard'
import { CheckoutStepsFrame } from '@/features/checkout/checkout-steps-frame'
import { ReviewActive } from '@/features/checkout/checkout-review-active'

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <CheckoutRouteGuard currentStepId='review'>
      <CheckoutStepsFrame currentStepId='review'>
        <ReviewActive />
      </CheckoutStepsFrame>
    </CheckoutRouteGuard>
  )
}
