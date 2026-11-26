/**
 * Account route group, signed in as the worker's account. A guest would be
 * sent to sign-in, so staying on the route also shows the sign-in worked.
 */

import { expect, signedInTest as test } from '../journeys/support/fixtures'
import {
  accountPages,
  atPath,
  openRoute,
  orderDetailPage,
} from '../journeys/support/pages'
import { PLACEHOLDER_IDS, ROUTES } from '../journeys/support/test-data'

const TAGS = ['@desktop', '@mobile', '@priority-high', '@unverified']

test.describe('Account routes', { tag: '@smoke' }, () => {
  test('overview', { tag: TAGS }, async ({ page }) => {
    await openRoute(page, ROUTES.account)

    await expect(page).toHaveURL(atPath(ROUTES.account))
    await expect(accountPages.overviewHeading(page)).toBeVisible()
  })

  test('orders', { tag: TAGS }, async ({ page }) => {
    await openRoute(page, ROUTES.accountOrders)

    await expect(page).toHaveURL(atPath(ROUTES.accountOrders))
    await expect(accountPages.ordersHeading(page)).toBeVisible()
  })

  test('my data', { tag: TAGS }, async ({ page }) => {
    await openRoute(page, ROUTES.accountMyData)

    await expect(page).toHaveURL(atPath(ROUTES.accountMyData))
    await expect(accountPages.myDataHeading(page)).toBeVisible()
    await expect(
      accountPages.myDataTab(page, 'personalDataLabel')
    ).toBeVisible()
  })

  test('addresses', { tag: TAGS }, async ({ page }) => {
    await openRoute(page, ROUTES.accountAddresses)

    await expect(page).toHaveURL(atPath(ROUTES.accountAddresses))
    await expect(accountPages.myDataHeading(page)).toBeVisible()
    await expect(accountPages.myDataTab(page, 'addressesLabel')).toBeVisible()
  })

  test('change password', { tag: TAGS }, async ({ page }) => {
    await openRoute(page, ROUTES.accountChangePassword)

    await expect(page).toHaveURL(atPath(ROUTES.accountChangePassword))
    await expect(accountPages.myDataHeading(page)).toBeVisible()
    await expect(
      accountPages.myDataTab(page, 'changePasswordLabel')
    ).toBeVisible()
  })

  test('order detail', { tag: TAGS }, async ({ page }) => {
    await openRoute(page, ROUTES.accountOrder(PLACEHOLDER_IDS.order))

    await expect(orderDetailPage.heading(page)).toBeAttached()
  })
})
