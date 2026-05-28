import { setRequestLocale } from 'next-intl/server'
import { CheckoutRouteGuard } from '@/features/checkout/checkout-route-guard'
import { CheckoutStepsFrame } from '@/features/checkout/checkout-steps-frame'
import { ShippingActive } from '@/features/checkout/checkout-shipping-active'

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <CheckoutRouteGuard currentStepId='shipping'>
      <CheckoutStepsFrame currentStepId='shipping'>
        <ShippingActive />
      </CheckoutStepsFrame>
    </CheckoutRouteGuard>
  )
}
