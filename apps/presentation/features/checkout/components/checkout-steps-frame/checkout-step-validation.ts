import type { CartResponse } from '@core/contracts/cart/cart'
import {
  CHECKOUT_STEPS,
  type CheckoutStep,
  type CheckoutStepId,
} from './checkout-steps-config'

type StepValidator = (cart: CartResponse) => boolean

const stepValidators: Record<CheckoutStepId, StepValidator> = {
  billing: (cart) => !!cart.billingAddress,
  shipping: (cart) => !!cart.shippingAddress,
  deliveryMethod: (cart) =>
    !!cart.shippingAddress && !!cart.shippingInfo?.shippingMethodId,
  payment: (cart) =>
    !!(cart.paymentInfo?.payments && cart.paymentInfo.payments.length > 0),
  review: (cart) => {
    // Review step is complete only if all previous steps are complete
    return (
      !!cart.billingAddress &&
      !!cart.shippingAddress &&
      !!cart.shippingInfo?.shippingMethodId &&
      !!(cart.paymentInfo?.payments && cart.paymentInfo.payments.length > 0)
    )
  },
  complete: () => true, // Complete step is always accessible (final step)
}

/**
 * Validates if a specific checkout step is complete based on cart data.
 *
 * @param stepId - The checkout step ID to validate
 * @param cart - The cart response or null
 * @returns true if the step is complete, false otherwise
 */
export function isStepComplete(
  stepId: CheckoutStepId,
  cart: CartResponse | null
): boolean {
  if (!cart) {
    return false
  }

  const validator = stepValidators[stepId]
  return validator ? validator(cart) : false
}

/**
 * Finds the first incomplete step.
 * - If `currentStepId` is provided, finds the first incomplete step before that step.
 * - If `currentStepId` is not provided, finds the first incomplete step in the entire checkout process (ignoring 'complete' step).
 * Returns null if all relevant steps are complete.
 *
 * @param cart - The cart response or null
 * @param currentStepId - Optional. The current checkout step ID. If provided, only checks steps before this step.
 * @returns The first incomplete step, or null if all relevant steps are complete
 */
export function getFirstIncompleteStep(
  cart: CartResponse | null,
  currentStepId?: CheckoutStepId
): CheckoutStep | null {
  if (!cart) {
    // Return first checkout step (billing) if no cart
    return CHECKOUT_STEPS.find((step) => step.id !== 'complete') ?? null
  }

  // Determine the range of steps to check
  let stepsToCheck: CheckoutStep[]
  if (currentStepId) {
    const currentIndex = CHECKOUT_STEPS.findIndex(
      (step) => step.id === currentStepId
    )
    if (currentIndex === -1) {
      return null
    }
    // Check all steps before the current step
    stepsToCheck = CHECKOUT_STEPS.slice(0, currentIndex)
  } else {
    // Check all steps
    stepsToCheck = CHECKOUT_STEPS
  }

  // Find the first incomplete step (skipping 'complete')
  for (const step of stepsToCheck) {
    if (step.id === 'complete') {
      continue // Skip the complete step
    }
    if (!isStepComplete(step.id, cart)) {
      return step
    }
  }

  // All relevant steps are complete
  return null
}

/**
 * Determines if a checkout step is clickable (can be navigated to).
 * A step is clickable if:
 * - All previous steps are complete
 * - There is a cart
 * - It's not the 'complete' step (which should never be clickable)
 *
 * @param stepId - The checkout step ID to check
 * @param cart - The cart response or null
 * @returns true if the step is clickable, false otherwise
 */
export function isStepClickable(
  stepId: CheckoutStepId,
  cart: CartResponse | null
): boolean {
  if (stepId === 'complete') {
    return false
  }

  if (!cart) {
    return false
  }

  const incompleteStep = getFirstIncompleteStep(cart, stepId)
  return !incompleteStep
}
