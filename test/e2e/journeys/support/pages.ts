/**
 * Named locators and page steps shared by journey and smoke specs.
 * Visible text comes from core/i18n through t(), so specs run in any locale.
 */

import { expect, type APIRequestContext, type Page } from '@playwright/test'
import { STOREFRONT_URL } from '../../config'
import { escapeRegExp, tPattern } from './i18n'
import { ROUTES } from './test-data'

export const layout = {
  header: (page: Page) => page.getByRole('banner'),
  main: (page: Page) => page.getByRole('main'),
  /** Every level-1 heading: CMS pages can hold more than one. */
  pageHeadings: (page: Page) => page.getByRole('heading', { level: 1 }),
}

export const productList = {
  tiles: (page: Page) =>
    layout
      .main(page)
      .getByRole('link', { name: tPattern('productCard.linkAriaLabel') }),
}

/** Matches the page URL once it is at this storefront path (query string allowed). */
export const atPath = (path: string) =>
  new RegExp(`${escapeRegExp(path)}(\\?.*)?$`)

/** Opens a route and checks the storefront answered it, rather than a 404 or an error page. */
export async function openRoute(page: Page, path: string) {
  const response = await page.goto(path)
  expect(response?.status(), `status of ${path}`).toBeLessThan(400)
  await expect(layout.pageHeadings(page)).not.toHaveCount(0)
}

/** Opens the test-data category and returns the URL of a product it lists. */
export async function findProductUrl(page: Page): Promise<string> {
  await openRoute(page, ROUTES.category)
  const tiles = productList.tiles(page)
  await expect(tiles).not.toHaveCount(0)
  // Test data, not a locator: any product the category lists will do, so read
  // every tile's link and take one instead of pointing at a tile by position
  const [href] = await tiles.evaluateAll((links) =>
    links.map((link) => link.getAttribute('href') ?? '')
  )
  expect(href, 'product tile link').toMatch(/\/p\/.+variantId=/)
  return href
}

/** Expires the journey storefront's Data Cache, so its next render fetches from the BFF. */
export async function expireStorefrontCache(request: APIRequestContext) {
  const res = await request.get(`${STOREFRONT_URL}/api/e2e/revalidate`)
  expect(res.ok(), 'storefront cache revalidation').toBe(true)
}

/** Status of a storefront page fetched without a browser (only its server talks to the BFF). */
export async function storefrontStatus(
  request: APIRequestContext,
  path: string
) {
  return (await request.get(`${STOREFRONT_URL}${path}`)).status()
}
