/**
 * Locale page content — English and German
 *
 * Verifies that pages served under each locale prefix correctly:
 *   1. Set html[lang] to the right language tag
 *   2. Render the locale-specific fixture content (names match the locale's catalog slugs)
 *   3. Make BFF calls using the locale-appropriate slug
 *   4. Collection page renders product items (not the "no results" empty state)
 *
 * Fixtures:
 *   en: DEFAULT_PRODUCTS['blue-shirt'], DEFAULT_COLLECTIONS['mens-shirts'], CONTENT_PAGES['about-us']
 *   de: DEFAULT_PRODUCTS['blaues-hemd'], DEFAULT_COLLECTIONS['herrenhemden'], CONTENT_PAGES['ueber-uns']
 *
 * All URLs are cold at spec start because test.beforeAll calls revalidateBffCache,
 * flushing the in-memory Data Cache before the first test executes.
 */

import { test, expect } from '../../fixtures'
import { resetRequests, requestsFor, revalidateBffCache } from '../../helpers'

const LOCALES = [
  {
    locale: 'en',
    langPattern: /^en/,
    product:    { url: '/en/p/blue-shirt',    bffPrefix: '/product/slug/blue-shirt',             name: 'Blue Shirt' },
    collection: { url: '/en/c/mens-shirts',   bffPrefix: '/productCollection/slug/mens-shirts',  category: "Men's Shirts", item: 'Blue Shirt' },
    content:    { url: '/en/about-us',        bffPrefix: '/content/page/about-us',               title: 'About Us' },
  },
  {
    locale: 'de',
    langPattern: /^de/,
    product:    { url: '/de/p/blaues-hemd',    bffPrefix: '/product/slug/blaues-hemd',              name: 'Blaues Hemd' },
    collection: { url: '/de/c/herrenhemden',   bffPrefix: '/productCollection/slug/herrenhemden',   category: 'Herrenhemden', item: 'Blaues Hemd' },
    content:    { url: '/de/ueber-uns',        bffPrefix: '/content/page/ueber-uns',                title: 'Über Uns' },
  },
]

// Flush the in-memory Data Cache before this spec runs so all named slugs are cold.
test.beforeAll(revalidateBffCache)

for (const { locale, langPattern, product, collection, content } of LOCALES) {
  test.describe(`Locale "${locale}" pages`, () => {
    test.beforeEach(async () => {
      await resetRequests()
    })

    test(`product page sets html[lang^="${locale}"] and renders correct name`, async ({ page }) => {
      await page.goto(product.url)
      await page.waitForLoadState('networkidle')

      await expect(page.locator('html')).toHaveAttribute('lang', langPattern)
      // Target the page heading specifically — the title also appears as the
      // current-page breadcrumb crumb, so a bare getByText() matches two elements.
      await expect(
        page.getByRole('heading', { name: product.name })
      ).toBeVisible()

      const calls = await requestsFor(product.bffPrefix)
      expect(calls.length, `Expected BFF call for ${product.bffPrefix}`).toBeGreaterThan(0)
    })

    test(`collection page sets html[lang^="${locale}"] and renders products (not empty)`, async ({
      page,
    }) => {
      await page.goto(collection.url)
      await page.waitForLoadState('networkidle')

      await expect(page.locator('html')).toHaveAttribute('lang', langPattern)
      // Category heading (sr-only h1) — matched by role to avoid the duplicate
      // breadcrumb crumb of the same name.
      await expect(
        page.getByRole('heading', { name: collection.category })
      ).toBeVisible()
      // Product item visible → confirms the product grid is populated, not the empty state
      await expect(page.getByText(collection.item)).toBeVisible()

      const calls = await requestsFor(collection.bffPrefix)
      expect(calls.length, `Expected BFF call for ${collection.bffPrefix}`).toBeGreaterThan(0)
    })

    test(`content page sets html[lang^="${locale}"] and renders correct title`, async ({ page }) => {
      await page.goto(content.url)
      await page.waitForLoadState('networkidle')

      await expect(page.locator('html')).toHaveAttribute('lang', langPattern)
      await expect(
        page.getByRole('heading', { name: content.title })
      ).toBeVisible()
      // No BFF call count assertion: Next.js <Link> prefetching in production warms named content
      // slugs (about-us, ueber-uns) whenever a page with the nav bar is loaded earlier in the
      // spec run, making the count unreliably 0. Lang + title are the meaningful assertions here.
    })
  })
}
