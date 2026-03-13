export type CheckoutStepId =
  | 'billing'
  | 'shipping'
  | 'deliveryMethod'
  | 'payment'
  | 'review'
  | 'complete'

export interface CheckoutStep {
  id: CheckoutStepId
  number: number
  route: string
  translationKey: `${CheckoutStepId}.title`
}

export const CHECKOUT_STEPS: CheckoutStep[] = [
  {
    id: 'billing',
    number: 1,
    route: '/checkout/billing',
    translationKey: 'billing.title',
  },
  {
    id: 'shipping',
    number: 2,
    route: '/checkout/shipping',
    translationKey: 'shipping.title',
  },
  {
    id: 'deliveryMethod',
    number: 3,
    route: '/checkout/delivery-method',
    translationKey: 'deliveryMethod.title',
  },
  {
    id: 'payment',
    number: 4,
    route: '/checkout/payment',
    translationKey: 'payment.title',
  },
  {
    id: 'review',
    number: 5,
    route: '/checkout/review',
    translationKey: 'review.title',
  },
  {
    id: 'complete',
    number: 6,
    route: '/checkout/complete',
    translationKey: 'complete.title',
  },
]

export function getNextStep(
  currentStepId: CheckoutStepId
): CheckoutStep | null {
  const currentIndex = CHECKOUT_STEPS.findIndex(
    (step) => step.id === currentStepId
  )
  if (currentIndex === -1 || currentIndex === CHECKOUT_STEPS.length - 1) {
    return null
  }
  return CHECKOUT_STEPS[currentIndex + 1]
}

/**
 * Maps a route path to a checkout step ID.
 * Returns null if the route doesn't match any checkout step.
 * Handles routes with locale prefixes (e.g., '/en-US/checkout/billing').
 *
 * @param route - The route path (e.g., '/checkout/billing' or '/en-US/checkout/billing')
 * @returns The checkout step ID or null if not found
 */
export function getStepIdFromRoute(route: string): CheckoutStepId | null {
  // Find the step whose route is contained in the pathname
  // This handles both '/checkout/billing' and '/en-US/checkout/billing'
  const step = CHECKOUT_STEPS.find((s) => route.includes(s.route))
  return step?.id ?? null
}
