/**
 * Account route group, signed in as the worker's account. A guest would be
 * sent to sign-in, so staying on the route also shows the sign-in worked.
 */

import { expect, signedInTest as test } from '../journeys/support/fixtures'
import { atPath, openRoute } from '../journeys/support/pages'
import { ROUTES } from '../journeys/support/test-data'

const TAGS = ['@desktop', '@mobile', '@priority-high', '@unverified']

test.describe('Account routes', { tag: '@smoke' }, () => {
  test('overview', { tag: TAGS }, async ({ page }) => {
    await openRoute(page, ROUTES.account)

    await expect(page).toHaveURL(atPath(ROUTES.account))
  })

  test('orders', { tag: TAGS }, async ({ page }) => {
    await openRoute(page, ROUTES.accountOrders)

    await expect(page).toHaveURL(atPath(ROUTES.accountOrders))
  })

  test('my data', { tag: TAGS }, async ({ page }) => {
    await openRoute(page, ROUTES.accountMyData)

    await expect(page).toHaveURL(atPath(ROUTES.accountMyData))
  })

  test('addresses', { tag: TAGS }, async ({ page }) => {
    await openRoute(page, ROUTES.accountAddresses)

    await expect(page).toHaveURL(atPath(ROUTES.accountAddresses))
  })

  test('change password', { tag: TAGS }, async ({ page }) => {
    await openRoute(page, ROUTES.accountChangePassword)

    await expect(page).toHaveURL(atPath(ROUTES.accountChangePassword))
  })
})
