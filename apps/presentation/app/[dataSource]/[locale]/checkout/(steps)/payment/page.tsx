import { setRequestLocale } from 'next-intl/server'
import { CheckoutRouteGuard } from '@/features/checkout/checkout-route-guard'
import { CheckoutStepsFrame } from '@/features/checkout/checkout-steps-frame'
import { PaymentActive } from '@/features/checkout/checkout-payment-active'

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <CheckoutRouteGuard currentStepId='payment'>
      <CheckoutStepsFrame currentStepId='payment'>
        <PaymentActive />
      </CheckoutStepsFrame>
    </CheckoutRouteGuard>
  )
}
