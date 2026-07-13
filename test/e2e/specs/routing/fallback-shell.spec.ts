/**
 * Pages outside [variant]/[locale] tree render with <html>/<body>, and paths
 * that bypass the middleware matcher (dot-containing segments) get a clean 404.
 *
 * Root fallback shell: any render outside the [variant]/[locale] tree yields
 * markup with no <html>/<body> (missing lang, no global styles/fonts) without
 * the RootFallbackShell fix.
 *
 * Middleware bypass: the middleware matcher excludes paths whose segments contain
 * a dot (.*\. lookahead) to skip static asset requests. Dot-prefixed paths like
 * /.well-known/... land on the Next.js router where [variant] would match them
 * dynamically. initRouteContext calls notFound() for any segment that is not a
 * valid ~-prefixed variant key, so these return a clean 404 rather than a 500.
 *
 * Corner cases:
 *   - Completely unknown path → 404 with proper HTML
 *   - Nested unknown path → 404 with proper HTML
 *   - Root "/" → renders the default-locale homepage at the clean URL
 *     (internal rewrite; localePrefix 'as-needed' keeps the default locale unprefixed)
 *   - Unknown path under a valid locale prefix (/de/...) → 404 with lang="de"
 *   - /.well-known/... → 404 (bypasses middleware, initRouteContext notFound() guard)
 *   - Dot-prefixed first segment → 404 (same guard)
 *   - Dot-prefixed first segment → 404 (initRouteContext notFound() guard)
 */

import { test, expect } from '../../fixtures'

test.describe('Root fallback shell on 404', () => {
  test('completely unknown path → 404 with <html>/<body>/lang', async ({ page }) => {
    const response = await page.goto('/this-path-definitely-does-not-exist-xyz')
    expect(response?.status()).toBe(404)

    const htmlEl = page.locator('html')
    await expect(htmlEl).toBeVisible()
    await expect(page.locator('body')).toBeVisible()

    const lang = await htmlEl.getAttribute('lang')
    expect(lang, 'html lang attribute must be set by RootFallbackShell').toBeTruthy()
    expect(lang!.length).toBeGreaterThan(0)
    expect(lang).toMatch(/^en/)
    await expect(page.getByText('Page not found')).toBeVisible()
  })

  test('404 page includes a visible heading (not a blank page)', async ({ page }) => {
    await page.goto('/this-path-definitely-does-not-exist-xyz')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found')
  })

  test('nested unknown path → 404 with proper HTML document', async ({ page }) => {
    const response = await page.goto('/en/this/nested/path/does/not/exist/either')
    expect(response?.status()).toBe(404)
    await expect(page.locator('html')).toBeVisible()
    await expect(page.locator('body')).toBeVisible()
    await expect(page.getByText('Page not found')).toBeVisible()
  })

  test('unknown path under /de → 404 with html lang="de"', async ({ page }) => {
    const response = await page.goto('/de/this-does-not-exist-in-german')
    // 404 — and the RootFallbackShell lang should be "de" when the locale was parsed
    expect(response?.status()).toBe(404)
    await expect(page.locator('html')).toBeVisible()
    // lang may be "de" or "de-DE" depending on the shell; either is acceptable
    const lang = await page.locator('html').getAttribute('lang')
    expect(lang).toBeTruthy()
    expect(lang).toMatch(/^de/)
    await expect(page.getByText('Seite nicht gefunden')).toBeVisible()
  })
})

// ─── Dot-path middleware bypass ───────────────────────────────────────────────

test.describe('Dot-containing paths return 404, not a server error', () => {
  // The middleware matcher's .*\. lookahead excludes paths whose segments contain a
  // dot, so dot-prefixed paths bypass the middleware and land on the Next.js router.
  // Without the fix they matched [variant] with an invalid segment and threw a 500.
  // With the fix, initRouteContext calls notFound() for any non-~-prefixed segment.
  // Redirects for known paths (e.g. /.well-known/change-password) are infrastructure
  // concerns handled outside the Next.js app.

  test('/.well-known/change-password → 404', async ({ page }) => {
    const response = await page.goto('/.well-known/change-password')
    expect(response?.status()).toBe(404)
  })

  test('/.well-known/apple-app-site-association → 404', async ({ page }) => {
    const response = await page.goto('/.well-known/apple-app-site-association')
    expect(response?.status()).toBe(404)
  })

  test('dot-prefixed first segment → 404 page, not a 500 error', async ({ page }) => {
    const response = await page.goto('/.hidden-dir/resource')
    expect(response?.status()).toBe(404)
    await expect(page.getByText('Page not found')).toBeVisible()
  })
})

// ─── Root path ────────────────────────────────────────────────────────────────

test.describe('Root path behaviour', () => {
  test('GET / renders the default-locale homepage at the clean URL', async ({ page }) => {
    // localePrefix 'as-needed': the default locale lives UNPREFIXED at /.
    // The proxy rewrites internally to /<variant>/en — the address bar stays /.
    // (A / → /en redirect would loop: intlMiddleware canonicalizes /en back to /.)
    const response = await page.goto('/')
    await page.waitForLoadState('networkidle')
    expect(response?.status()).toBe(200)
    expect(new URL(page.url()).pathname).toBe('/')
    await expect(page.locator('html')).toHaveAttribute('lang', /en/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText('Free shipping over €50')).toBeVisible()
  })

  test('GET /en canonicalizes to the clean root URL', async ({ page }) => {
    // intlMiddleware ('as-needed') strips the default-locale prefix via redirect.
    await page.goto('/en')
    await page.waitForLoadState('networkidle')
    expect(new URL(page.url()).pathname).toBe('/')
    await expect(page.locator('html')).toHaveAttribute('lang', /^en/)
  })
})
