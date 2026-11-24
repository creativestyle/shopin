/**
 * Test data per integration. Specs find products and orders through the
 * storefront; these files name only what a spec cannot discover there
 * (a category with products, a search term, a CMS page, an address).
 */

import { resolveIntegrations } from '../../../stack/integrations'
import { LOCALE, localePath } from '../i18n'
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
}

/** A fresh address per call, so parallel runs and retries never collide. */
export function uniqueEmail(label = 'shopper') {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return `e2e+${label}-${suffix}@example.com`
}
