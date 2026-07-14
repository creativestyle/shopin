import { initRouteContext } from '@/lib/request-context/route-context'
import { CheckoutStepPage } from '../checkout-step-page'
import { DeliveryMethodActive } from '@/features/checkout/checkout-delivery-method-active'

export default async function Page({
  params,
}: {
  params: Promise<{ variant: string; locale: string }>
}) {
  const { variant, locale } = await params
  initRouteContext({ variant, locale })

  return (
    <CheckoutStepPage stepId='deliveryMethod'>
      <DeliveryMethodActive />
    </CheckoutStepPage>
  )
}
