import { CheckoutRouteGuard } from '@/features/checkout/checkout-route-guard'
import { CheckoutStepsFrame } from '@/features/checkout/checkout-steps-frame'
import { PaymentActive } from '@/features/checkout/checkout-payment-active'

export default async function CheckoutPaymentPage() {
  return (
    <CheckoutRouteGuard currentStepId='payment'>
      <CheckoutStepsFrame currentStepId='payment'>
        <PaymentActive />
      </CheckoutStepsFrame>
    </CheckoutRouteGuard>
  )
}
