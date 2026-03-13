import { CheckoutRouteGuard } from '@/features/checkout/checkout-route-guard'
import { CheckoutStepsFrame } from '@/features/checkout/checkout-steps-frame'
import { BillingActive } from '@/features/checkout/checkout-billing-active'

export default async function CheckoutBillingPage() {
  return (
    <CheckoutRouteGuard currentStepId='billing'>
      <CheckoutStepsFrame currentStepId='billing'>
        <BillingActive />
      </CheckoutStepsFrame>
    </CheckoutRouteGuard>
  )
}
