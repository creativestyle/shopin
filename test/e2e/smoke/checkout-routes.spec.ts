/**
 * Checkout route group: each step page with a cart that has reached it, and
 * the payment callback and order-complete routes.
 */

import { prepareCheckout } from '../journeys/support/checkout'
import { expect, test } from '../journeys/support/fixtures'
import { atPath, checkoutPages, openRoute } from '../journeys/support/pages'
import {
  CHECKOUT_STEP_PATHS,
  PLACEHOLDER_IDS,
  ROUTES,
  type CheckoutStep,
} from '../journeys/support/test-data'

const TAGS = ['@desktop', '@mobile', '@priority-high', '@unverified']

test.describe('Checkout routes', { tag: '@smoke' }, () => {
  for (const step of Object.keys(CHECKOUT_STEP_PATHS) as CheckoutStep[]) {
    test(`${step} step`, { tag: TAGS }, async ({ page }) => {
      await prepareCheckout(page)

      await openRoute(page, ROUTES.checkoutStep(step))

      await expect(checkoutPages.activeStep(page, step)).toBeVisible()
    })
  }

  test('payment success callback', { tag: TAGS }, async ({ page }) => {
    await openRoute(page, ROUTES.paymentSuccess(PLACEHOLDER_IDS.payment))

    await expect(checkoutPages.paymentCallbackHeading(page)).toBeAttached()
  })

  test(
    'payment failure callback sends an empty cart back to the cart',
    { tag: TAGS },
    async ({ page }) => {
      await page.goto(ROUTES.paymentFailure(PLACEHOLDER_IDS.payment))

      await expect(page).toHaveURL(atPath(ROUTES.cart))
    }
  )

  test(
    'order complete without an order sends the shopper home',
    { tag: TAGS },
    async ({ page }) => {
      await page.goto(ROUTES.checkoutComplete)

      await expect(page).toHaveURL(atPath(ROUTES.home))
    }
  )
})
