import { CheckoutRouteGuard } from '@/features/checkout/checkout-route-guard'
import { CheckoutStepsFrame } from '@/features/checkout/checkout-steps-frame'
import { ShippingActive } from '@/features/checkout/checkout-shipping-active'

export default async function CheckoutShippingPage() {
  return (
    <CheckoutRouteGuard currentStepId='shipping'>
      <CheckoutStepsFrame currentStepId='shipping'>
        <ShippingActive />
      </CheckoutStepsFrame>
    </CheckoutRouteGuard>
  )
}
