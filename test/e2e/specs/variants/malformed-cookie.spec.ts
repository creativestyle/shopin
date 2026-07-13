/**
 * Malformed / disallowed data-source cookie falls back to default without crashing.
 *
 * resolveVariant() treats any unknown or undecodable cookie value as the default
 * data source. safeDecodeUriComponent wraps any decodeURIComponent call and returns
 * null on URIError so a bare-% cookie never propagates out of bffFetch.
 *
 * Corner cases covered:
 *   - Bare-% malformed cookie (URIError trigger)
 *   - Completely unknown value ("not-a-valid-datasource-value")
 *   - Known-format but disallowed value ("bogus-source")
 *   - Empty string value
 *   - Unicode garbage ("💥💥💥")
 *
 * For every case: page renders with status < 500; BFF receives default X-Data-Source
 * (or no header, which also means default).
 */

import { test, expect } from '../../fixtures'
import { resetRequests, requestsFor } from '../../helpers'

type CookieCase = { label: string; value: string }

const MALFORMED_CASES: CookieCase[] = [
  { label: 'bare-% malformed value', value: 'commercial%ools-set' },
  { label: 'completely unknown value', value: 'not-a-valid-datasource-value' },
  { label: 'disallowed value', value: 'bogus-source' },
  { label: 'empty string', value: '' },
  { label: 'unicode garbage', value: '💥💥💥' },
]

for (const { label, value } of MALFORMED_CASES) {
  test(`[malformed cookie] ${label} → page renders, default BFF header, no 500`, async ({
    context,
    page,
  }) => {
    await resetRequests()

    await context.addCookies([
      {
        name: 'data-source',
        value,
        domain: 'localhost',
        path: '/',
        sameSite: 'Lax',
      },
    ])

    const response = await page.goto('/en/about-us')
    // Must not crash with a 5xx
    expect(response?.status(), `${label}: expected non-5xx status`).toBeLessThan(500)

    await page.waitForLoadState('networkidle')

    // Body must be visible (no blank page / error boundary covering the whole screen)
    await expect(page.locator('body')).toBeVisible()

    // Page content must render (not an error boundary)
    await expect(page.getByRole('heading', { name: 'About Us' })).toBeVisible()

    // BFF calls must use the default data source (or carry no X-Data-Source, which also means default)
    const allCalls = await requestsFor('/')
    const contentCalls = allCalls.filter(
      (r) => !r.path.startsWith('/__') && !r.path.startsWith('/navigation')
    )
    for (const call of contentCalls) {
      const ds = call.headers['x-data-source']
      expect(
        ds === undefined || ds === 'commercetools-set',
        `${label}: BFF call to ${call.path} had unexpected X-Data-Source: ${ds}`
      ).toBeTruthy()
    }
  })
}

test('malformed cookie does not prevent subsequent valid cookie from working', async ({
  context,
  page,
}) => {
  // Set a bad cookie first
  await context.addCookies([
    { name: 'data-source', value: 'bad%value', domain: 'localhost', path: '/', sameSite: 'Lax' },
  ])
  const res1 = await page.goto('/en/about-us')
  expect(res1?.status()).toBeLessThan(500)

  // Now clear and set a valid alt cookie.
  // Re-add demo-disclaimer-acknowledged so the modal doesn't interfere.
  await context.clearCookies()
  await context.addCookies([
    { name: 'data-source', value: 'commercetools-algolia-set', domain: 'localhost', path: '/', sameSite: 'Lax', httpOnly: false },
    { name: 'demo-disclaimer-acknowledged', value: 'true', domain: 'localhost', path: '/', sameSite: 'Lax', httpOnly: false },
  ])

  await resetRequests()
  // Use a unique probe slug — locale-switch tests warm the ISR cache for 'red-shoes'
  // before this test runs; a fresh probe slug guarantees a cold ISR + data cache hit.
  await page.goto('/en/p/probe-malformed-alt-valid')
  await page.waitForLoadState('networkidle')

  // Should now use alt data source correctly
  const calls = await requestsFor('/product/slug/probe-malformed-alt-valid')
  expect(calls.length).toBeGreaterThan(0)
  for (const call of calls) {
    expect(call.headers['x-data-source']).toBe('commercetools-algolia-set')
  }

  await expect(page.getByText('commercetools-algolia-set — probe-malformed-alt-valid')).toBeVisible()
})
