import { CheckoutRouteGuard } from '@/features/checkout/checkout-route-guard'
import { CheckoutStepsFrame } from '@/features/checkout/checkout-steps-frame'
import { ReviewActive } from '@/features/checkout/checkout-review-active'

export default async function CheckoutReviewPage() {
  return (
    <CheckoutRouteGuard currentStepId='review'>
      <CheckoutStepsFrame currentStepId='review'>
        <ReviewActive />
      </CheckoutStepsFrame>
    </CheckoutRouteGuard>
  )
}
