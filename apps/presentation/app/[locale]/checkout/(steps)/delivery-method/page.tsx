import { setRequestLocale } from 'next-intl/server'
import { CheckoutRouteGuard } from '@/features/checkout/checkout-route-guard'
import { CheckoutStepsFrame } from '@/features/checkout/checkout-steps-frame'
import { DeliveryMethodActive } from '@/features/checkout/checkout-delivery-method-active'

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <CheckoutRouteGuard currentStepId='deliveryMethod'>
      <CheckoutStepsFrame currentStepId='deliveryMethod'>
        <DeliveryMethodActive />
      </CheckoutStepsFrame>
    </CheckoutRouteGuard>
  )
}
