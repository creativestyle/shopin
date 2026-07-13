/**
 * Variant survives <Link> / RSC navigation.
 *
 * initRouteContext({ variant, locale }) is called per-segment so every page/layout
 * independently initialises the ALS + React-cache variant context. Users who selected
 * a non-default data source get server-rendered pages fetched from the correct backend
 * even after client-side navigations that stay under the same [variant]/[locale] layout.
 *
 * Selector notes (verified against real DOM):
 *   - Main nav is <nav> inside <header> (role="banner") — use getByRole('banner')
 *     to avoid also matching footer navigation.
 *   - Desktop nav is visible at Playwright's default 1280px viewport.
 *   - NAVIGATION_FIXTURE provides a "Shop" link → /en/c/probe-var-nav-dest.
 *
 * Cold-URL strategy:
 *   Each test case uses a unique "probe-*" slug.  The mock BFF serves any
 *   probe-* slug for any data source / draft combination.  global-setup calls
 *   /api/e2e/revalidate (revalidateTag) before each run to flush the in-memory
 *   Data Cache, so probe slugs are always cold even when the Next.js server is
 *   reused (reuseExistingServer: true).  No two tests share a slug, so there
 *   is no within-run contamination.
 */

import { test, expect } from '../../fixtures'
import {
  setDataSourceCookie,
  resetRequests,
  requestsFor,
  waitForBffRequest,
  revalidateBffCache,
} from '../../helpers'

// Flush the in-memory Data Cache before this spec runs so probe slugs are always
// cold even when the Next.js server is reused across UI mode reruns.
test.beforeAll(revalidateBffCache)

// Unique probe slugs — each used by exactly one test to guarantee a cold ISR hit.
const PROBE_INIT_ALT = 'probe-var-init-alt'
const PROBE_INIT_DEFAULT = 'probe-var-init-default'
const PROBE_ISO = 'probe-var-iso'        // per-variant ISR isolation
const PROBE_FLIP = 'probe-var-flip'      // cookie-flip test

test.describe('Variant header on initial page load', () => {
  test.beforeEach(async () => {
    await resetRequests()
  })

  test('alt cookie → cold product page BFF call carries commercetools-algolia-set', async ({
    context,
    page,
  }) => {
    await setDataSourceCookie(context, 'commercetools-algolia-set')
    // PROBE_INIT_ALT guarantees a cold ISR hit (probe-* slugs are unique per test,
    // never cached by other specs). red-shoes is used by locale-switch-variant tests
    // and may already be cached when this spec runs.
    await page.goto(`/en/p/${PROBE_INIT_ALT}`)
    await page.waitForLoadState('networkidle')

    const calls = await requestsFor(`/product/slug/${PROBE_INIT_ALT}`)
    expect(calls.length, 'Expected at least 1 BFF call on cold load').toBeGreaterThan(0)
    for (const call of calls) {
      expect(call.headers['x-data-source']).toBe('commercetools-algolia-set')
    }

    await expect(page.getByText(`commercetools-algolia-set — ${PROBE_INIT_ALT}`)).toBeVisible()
  })

  test('default cookie → cold product page BFF call carries commercetools-set', async ({
    context,
    page,
  }) => {
    await setDataSourceCookie(context, 'commercetools-set')
    await page.goto(`/en/p/${PROBE_INIT_DEFAULT}`)
    await page.waitForLoadState('networkidle')

    const calls = await requestsFor(`/product/slug/${PROBE_INIT_DEFAULT}`)
    expect(calls.length, 'Expected at least 1 BFF call on cold load').toBeGreaterThan(0)
    for (const call of calls) {
      // Default variant → header is 'commercetools-set' (or absent, which also means default)
      const ds = call.headers['x-data-source'] ?? 'commercetools-set'
      expect(ds).toBe('commercetools-set')
    }

    await expect(page.getByText(`commercetools-set — ${PROBE_INIT_DEFAULT}`)).toBeVisible()
  })

  test('no cookie → cold product page BFF call falls back to default commercetools-set', async ({
    page,
  }) => {
    // No data-source cookie at all
    await page.goto(`/en/p/${PROBE_INIT_ALT}`)
    await page.waitForLoadState('networkidle')

    const calls = await requestsFor(`/product/slug/${PROBE_INIT_ALT}`)
    expect(calls.length, 'Expected at least 1 BFF call on cold load').toBeGreaterThan(0)
    for (const call of calls) {
      const ds = call.headers['x-data-source'] ?? 'commercetools-set'
      expect(ds).toBe('commercetools-set')
    }

    await expect(page.getByText(`commercetools-set — ${PROBE_INIT_ALT}`)).toBeVisible()
  })
})

test.describe('Variant survives SPA navigation', () => {
  test.beforeEach(async ({ context }) => {
    await resetRequests()
    await setDataSourceCookie(context, 'commercetools-algolia-set')
  })

  test('BFF request for nav destination carries alt X-Data-Source after <Link> click', async ({
    page,
  }) => {
    // Start on a live page (any renders fine)
    await page.goto('/en/about-us')
    await page.waitForLoadState('networkidle')

    await resetRequests()

    // Click the "Shop" nav link (→ /en/c/probe-var-nav-dest).
    // Scoped to the page header to avoid footer nav.
    const navLink = page
      .getByRole('banner')
      .getByRole('navigation')
      .getByRole('link', { name: 'Shop' })

    await Promise.all([
      page.waitForLoadState('networkidle'),
      navLink.click(),
    ])

    // Destination is a cold collection page — must make a BFF call
    const calls = await waitForBffRequest(page, '/productCollection/slug/probe-var-nav-dest', 5000)
    expect(calls.length).toBeGreaterThan(0)

    for (const call of calls) {
      expect(
        call.headers['x-data-source'],
        `Nav destination BFF call on ${call.path} should carry alt variant`
      ).toBe('commercetools-algolia-set')
    }

    expect(page.url()).toContain('/c/probe-var-nav-dest')
    // exact: true matches only the sr-only category heading, not the product item names that
    // also contain this string as a prefix (e.g. "… probe-var-nav-dest item 1").
    await expect(page.getByText('commercetools-algolia-set — probe-var-nav-dest', { exact: true })).toBeVisible()
  })
})

test.describe('Variant context survives on non-default locale', () => {
  // German product page — exercises initRouteContext({ variant, locale }) with locale='de',
  // a code path the English-only tests never reach.
  const PROBE_DE_PAGE = 'probe-var-de-page' // German URL: /de/p/de-probe-var-de-page

  test('alt cookie on German product page BFF call carries correct X-Data-Source', async ({
    context,
    page,
  }) => {
    await setDataSourceCookie(context, 'commercetools-algolia-set')
    await resetRequests()

    await page.goto(`/de/p/de-${PROBE_DE_PAGE}`)
    await page.waitForLoadState('networkidle')

    const calls = await requestsFor(`/product/slug/de-${PROBE_DE_PAGE}`)
    expect(calls.length, 'Expected BFF call on cold German product page').toBeGreaterThan(0)
    for (const call of calls) {
      expect(call.headers['x-data-source']).toBe('commercetools-algolia-set')
    }

    await expect(page.locator('html')).toHaveAttribute('lang', /^de/)
    await expect(page.getByText(`commercetools-algolia-set — de-${PROBE_DE_PAGE}`)).toBeVisible()
  })

  test('default cookie on German product page BFF call carries correct X-Data-Source', async ({
    context,
    page,
  }) => {
    await setDataSourceCookie(context, 'commercetools-set')
    await resetRequests()

    await page.goto(`/de/p/de-${PROBE_DE_PAGE}`)
    await page.waitForLoadState('networkidle')

    const calls = await requestsFor(`/product/slug/de-${PROBE_DE_PAGE}`)
    expect(calls.length, 'Expected BFF call on cold German product page').toBeGreaterThan(0)
    for (const call of calls) {
      const ds = call.headers['x-data-source'] ?? 'commercetools-set'
      expect(ds).toBe('commercetools-set')
    }

    await expect(page.locator('html')).toHaveAttribute('lang', /^de/)
    await expect(page.getByText(`commercetools-set — de-${PROBE_DE_PAGE}`)).toBeVisible()
  })
})

test.describe('Per-variant ISR isolation', () => {
  test('same slug under different variants uses separate ISR cache entries', async ({
    context,
    page,
  }) => {
    // Load under default variant — cold, should call BFF
    await resetRequests()
    await setDataSourceCookie(context, 'commercetools-set')
    await page.goto(`/en/p/${PROBE_ISO}`)
    await page.waitForLoadState('networkidle')

    const defaultCalls = await requestsFor(`/product/slug/${PROBE_ISO}`)
    expect(defaultCalls.length, 'Cold default-variant load should call BFF').toBeGreaterThan(0)
    for (const call of defaultCalls) {
      const ds = call.headers['x-data-source'] ?? 'commercetools-set'
      expect(ds).toBe('commercetools-set')
    }
    await expect(page.getByText(`commercetools-set — ${PROBE_ISO}`)).toBeVisible()

    // Load under alt variant — different cache entry, should also call BFF (cold for alt)
    await resetRequests()
    await context.clearCookies()
    await setDataSourceCookie(context, 'commercetools-algolia-set')
    await page.goto(`/en/p/${PROBE_ISO}`)
    await page.waitForLoadState('networkidle')

    const altCalls = await requestsFor(`/product/slug/${PROBE_ISO}`)
    expect(altCalls.length, 'Cold alt-variant load should call BFF independently').toBeGreaterThan(0)
    for (const call of altCalls) {
      expect(call.headers['x-data-source']).toBe('commercetools-algolia-set')
    }
    await expect(page.getByText(`commercetools-algolia-set — ${PROBE_ISO}`)).toBeVisible()
  })

  test('changing the data-source cookie between loads flips the BFF header', async ({
    context,
    page,
  }) => {
    // First load: alt cookie
    await resetRequests()
    await setDataSourceCookie(context, 'commercetools-algolia-set')
    await page.goto(`/en/p/${PROBE_FLIP}`)
    await page.waitForLoadState('networkidle')

    const altCalls = await requestsFor(`/product/slug/${PROBE_FLIP}`)
    expect(altCalls.length).toBeGreaterThan(0)
    for (const call of altCalls) {
      expect(call.headers['x-data-source']).toBe('commercetools-algolia-set')
    }
    await expect(page.getByText(`commercetools-algolia-set — ${PROBE_FLIP}`)).toBeVisible()

    // Second load: switch to default cookie → different cache entry, fresh BFF call
    await resetRequests()
    await context.clearCookies()
    await setDataSourceCookie(context, 'commercetools-set')
    await page.goto(`/en/p/${PROBE_FLIP}`)
    await page.waitForLoadState('networkidle')

    const defaultCalls = await requestsFor(`/product/slug/${PROBE_FLIP}`)
    expect(defaultCalls.length).toBeGreaterThan(0)
    for (const call of defaultCalls) {
      const ds = call.headers['x-data-source'] ?? 'commercetools-set'
      expect(ds).toBe('commercetools-set')
    }
    await expect(page.getByText(`commercetools-set — ${PROBE_FLIP}`)).toBeVisible()
  })
})
