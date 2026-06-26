/**
 * Leaked internal ~variant/... URLs redirect to the clean path.
 *
 * The proxy uses hasVariantPrefix(firstSegment) and issues a 308 redirect for any
 * request whose first path segment starts with "~". This prevents internal variant
 * keys from leaking into public URLs (which would pin users to the wrong data source).
 *
 * Proxy behavior:
 *   - hasVariantPrefix(segment) → true for ANY segment starting with "~".
 *   - On match: 308 redirect to the path WITHOUT the ~variant prefix (clean URL).
 *   - Cookie is NOT consulted at the guard; the redirect Location is always the clean path.
 *   - After the redirect, the browser follows to the clean URL; the subsequent request IS
 *     processed with the data-source cookie → internal rewrite to ~<variant> is invisible.
 *   - For a "~default/en/path" URL: Location = "/en/path" (no ~, regardless of alt cookie).
 *   - For a "~alt/en/path" URL: Location = "/en/path" (same).
 *   - For "~bogus/en/path": hasVariantPrefix catches it → 308 (same as known variants).
 */

import { test, expect } from '../../fixtures'

test.describe('Leaked ~variant URL guard', () => {
  test('~commercetools-set/en/... issues 308 to the clean path (no ~ prefix)', async ({
    request,
  }) => {
    const response = await request.get('/~commercetools-set/en/about-us', {
      maxRedirects: 0,
    })
    expect(response.status()).toBe(308)
    const location = response.headers()['location']
    expect(location).toBeTruthy()
    expect(location).not.toMatch(/^\/~/)
    expect(location).toContain('/en/about-us')
  })

  test('~commercetools-algolia-set/en/... issues 308 to the clean path', async ({
    request,
  }) => {
    const response = await request.get('/~commercetools-algolia-set/en/about-us', {
      maxRedirects: 0,
    })
    expect(response.status()).toBe(308)
    const location = response.headers()['location']
    expect(location).toBeTruthy()
    expect(location).not.toMatch(/^\/~/)
    expect(location).toContain('/en/about-us')
  })

  test('~default URL with alt cookie → 308 Location is still clean /en/... (not /~alt/...)', async ({
    context,
    request,
  }) => {
    // Even with an alt data-source cookie, the leaked-URL guard strips the prefix to a clean
    // path; it does NOT re-add the alt variant prefix in the Location.  The subsequent follow
    // request will carry the alt cookie and be rewritten internally (invisible to the address bar).
    await context.addCookies([
      { name: 'data-source', value: 'commercetools-algolia-set', domain: 'localhost', path: '/' },
    ])
    const response = await context.request.get('/~commercetools-set/en/about-us', {
      maxRedirects: 0,
    })
    expect(response.status()).toBe(308)
    const location = response.headers()['location']
    expect(location).toBeTruthy()
    expect(location).not.toMatch(/^\/~/)
    expect(location).toContain('/en/about-us')
  })

  test('following the 308 redirect renders the page (address bar has no ~ prefix)', async ({
    page,
  }) => {
    // Playwright follows redirects by default.
    await page.goto('/~commercetools-set/en/about-us')
    // Address bar must be clean (no ~ segment)
    await expect(page).not.toHaveURL(/\/~/)
    await expect(page.locator('body')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'About Us' })).toBeVisible()
  })

  test('following a leaked alt URL also renders with clean address bar', async ({ page }) => {
    await page.goto('/~commercetools-algolia-set/en/about-us')
    await expect(page).not.toHaveURL(/\/~/)
    await expect(page.locator('body')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'About Us' })).toBeVisible()
  })

  test('~variant with only the root path (no slug) 308-redirects to /', async ({ request }) => {
    const response = await request.get('/~commercetools-set', { maxRedirects: 0 })
    expect(response.status()).toBe(308)
    const location = response.headers()['location']
    expect(location).toBeTruthy()
    expect(location).not.toMatch(/^\/~/)
  })
})

test.describe('Any ~-prefixed segment 308-redirects to the clean path', () => {
  test('~invalid value 308-redirects to the clean path', async ({ request }) => {
    // hasVariantPrefix catches ANY ~ prefix — valid or bogus — before intlMiddleware runs.
    const response = await request.get('/~invalid/en/about-us', { maxRedirects: 0 })
    expect(response.status()).toBe(308)
    const location = response.headers()['location']
    expect(location).toContain('/en/about-us')
    expect(location).not.toMatch(/^\/~/)
  })

  test('~mock-set is an allowed value and also 308-redirects cleanly', async ({ request }) => {
    const response = await request.get('/~mock-set/en/about-us', { maxRedirects: 0 })
    expect(response.status()).toBe(308)
    const location = response.headers()['location']
    expect(location).toBeTruthy()
    expect(location).not.toMatch(/^\/~/)
    expect(location).toContain('/en/about-us')
  })
})
