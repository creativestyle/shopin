/**
 * Test data per integration. Specs find products and orders through the
 * storefront; these files name only what a spec cannot discover there
 * (a category with products, a search term, a CMS page, an address).
 */

import { resolveIntegrations } from '../../../stack/integration-choice'
import { LOCALE, localePath } from '../i18n'
import { RUN_ID, workerLabel } from '../run'
import { MOCK_DATA } from './mock'
import { COMMERCETOOLS_DATA } from './commercetools'
import type { IntegrationTestData } from './types'

export type { IntegrationTestData } from './types'

const DATA_BY_COMMERCE: Record<string, IntegrationTestData> = {
  mock: MOCK_DATA,
  commercetools: COMMERCETOOLS_DATA,
}

const commerce = resolveIntegrations().serves.commerce

export const TEST_DATA = DATA_BY_COMMERCE[commerce][LOCALE]

/** Checkout steps by their core/i18n id (`checkout.steps.<id>.title`). */
export const CHECKOUT_STEP_PATHS = {
  billing: '/checkout/billing',
  shipping: '/checkout/shipping',
  deliveryMethod: '/checkout/delivery-method',
  payment: '/checkout/payment',
  review: '/checkout/review',
} as const

export type CheckoutStep = keyof typeof CHECKOUT_STEP_PATHS

/** Ids routes only need to carry, never ones a backend must know. */
export const PLACEHOLDER_IDS = {
  payment: 'e2e-smoke',
  order: 'e2e-unknown-order',
  token: 'e2e-token',
}

export const ROUTES = {
  home: localePath('/'),
  cart: localePath('/cart'),
  wishlist: localePath('/wishlist'),
  checkout: localePath('/checkout'),
  signIn: localePath('/sign-in'),
  signUp: localePath('/sign-up'),
  forgotPassword: localePath('/forgot-password'),
  account: localePath('/account'),
  accountOrders: localePath('/account/orders'),
  accountMyData: localePath('/account/my-data'),
  accountAddresses: localePath('/account/my-data/addresses'),
  accountChangePassword: localePath('/account/my-data/change-password'),
  category: localePath(TEST_DATA.categoryPath),
  cmsPage: TEST_DATA.cmsPagePath && localePath(TEST_DATA.cmsPagePath),
  search: (term: string) =>
    `${localePath('/search')}?q=${encodeURIComponent(term)}`,
  mockedPaymentStep: (paymentId: string) =>
    `/demo/mocked-payment-step/${encodeURIComponent(paymentId)}`,
  checkoutStep: (step: CheckoutStep) => localePath(CHECKOUT_STEP_PATHS[step]),
  paymentSuccess: (paymentId: string) =>
    `${localePath('/checkout/payment/success')}?paymentId=${encodeURIComponent(paymentId)}`,
  paymentFailure: (paymentId: string) =>
    `${localePath('/checkout/payment/failure')}?paymentId=${encodeURIComponent(paymentId)}`,
  checkoutComplete: localePath('/checkout/complete'),
  accountOrder: (orderId: string) =>
    localePath(`/account/orders/${encodeURIComponent(orderId)}`),
  resetPassword: localePath('/reset-password'),
  forgotPasswordSuccess: localePath('/forgot-password/success'),
  signUpSuccess: (token: string) =>
    `${localePath('/sign-up/success')}?token=${encodeURIComponent(token)}`,
  verifyEmail: localePath('/sign-up/verify-email'),
}

let counter = 0

/** Unique to the run and worker, so reruns and parallel workers never collide. */
export function uniqueEmail(label = 'shopper') {
  // Both passes of npm run e2e share the run id but restart worker indexes
  const pass = process.env.E2E_FAULT_RUN === '1' ? 'faults-' : ''
  return `e2e+${RUN_ID}-${pass}${workerLabel()}-${label}-${++counter}@example.com`
}
