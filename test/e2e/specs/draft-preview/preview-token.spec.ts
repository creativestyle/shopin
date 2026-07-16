/**
 * Preview token delivery and draft content rendering.
 *
 * /api/draft on HTTP (localhost) redirects with ?__pt=<token>; the preview page
 * renders draft content and the BFF receives x-next-draft-mode. The route checks
 * the secret before slug/locale, so an invalid secret returns 401, not 400.
 *
 * The preview layout renders StripPreviewToken, a client component that removes
 * __pt from the address bar after hydration. The session cookie keeps the draft
 * session alive for subsequent navigations and reloads.
 */

import { test, expect } from '../../fixtures'
import {
  mintPreviewToken,
  buildDraftApiUrl,
  buildDirectPreviewUrl,
  resetRequests,
  requestsFor,
} from '../../helpers'
import { E2E_DRAFT_SECRET, APP_BASE } from '../../config'

// ─── /api/draft entry route ───────────────────────────────────────────────────

test.describe('Preview token — /api/draft HTTP flow', () => {
  test('valid secret en-US → 307 redirect to /preview/<slug>?__pt=<token>', async ({
    request,
  }) => {
    // Check the redirect Location header directly — the settled page URL no longer
    // contains __pt= because StripPreviewToken removes it from the address bar after
    // hydration. The 307 Location itself always carries __pt on HTTP (local dev).
    const draftUrl = buildDraftApiUrl(E2E_DRAFT_SECRET, 'about-us', 'en-US')
    const response = await request.get(draftUrl, { maxRedirects: 0 })
    expect(response.status()).toBe(307)
    const location = response.headers()['location']
    expect(location).toMatch(/\/preview\/about-us/)
    expect(location).toContain('__pt=')
  })

  test('valid secret de-DE → 307 redirect to /de/preview/<slug>?__pt=<token>', async ({
    request,
  }) => {
    const draftUrl = buildDraftApiUrl(E2E_DRAFT_SECRET, 'ueber-uns', 'de-DE')
    const response = await request.get(draftUrl, { maxRedirects: 0 })
    expect(response.status()).toBe(307)
    const location = response.headers()['location']
    expect(location).toMatch(/\/de\/preview\/ueber-uns/)
    expect(location).toContain('__pt=')
  })

  test('/api/draft renders draft content (BFF receives x-next-draft-mode header)', async ({
    page,
  }) => {
    await resetRequests()
    const draftUrl = buildDraftApiUrl(E2E_DRAFT_SECRET, 'about-us', 'en-US')
    await page.goto(draftUrl, { waitUntil: 'networkidle' })

    const calls = await requestsFor('/content/page/about-us')
    expect(calls.length).toBeGreaterThan(0)
    for (const call of calls) {
      expect(call.headers['x-next-draft-mode']).toBeTruthy()
    }

    await expect(page.getByText(/DRAFT:/i)).toBeVisible({ timeout: 10_000 })
  })

  test('invalid secret → 401', async ({ request }) => {
    const url = buildDraftApiUrl('wrong-secret', 'about-us', 'en-US')
    const response = await request.get(url, { maxRedirects: 0 })
    expect(response.status()).toBe(401)
  })

  test('valid secret + missing slug → 400', async ({ request }) => {
    const url = new URL('/api/draft', APP_BASE)
    url.searchParams.set('secret', E2E_DRAFT_SECRET)
    url.searchParams.set('locale', 'en-US')
    const response = await request.get(url.toString(), { maxRedirects: 0 })
    expect(response.status()).toBe(400)
  })

  test('valid secret + missing locale → 400', async ({ request }) => {
    const url = new URL('/api/draft', APP_BASE)
    url.searchParams.set('secret', E2E_DRAFT_SECRET)
    url.searchParams.set('slug', 'about-us')
    const response = await request.get(url.toString(), { maxRedirects: 0 })
    expect(response.status()).toBe(400)
  })

  test('slug of only slashes falls back to homepage slug', async ({ page }) => {
    // A slug of "///" normalises to "" → getHomepageSlugForLocale() is called.
    // The mock serves CONTENT_PAGES['homepage'] → redirects to /preview/homepage.
    const url = new URL('/api/draft', APP_BASE)
    url.searchParams.set('secret', E2E_DRAFT_SECRET)
    url.searchParams.set('slug', '///')
    url.searchParams.set('locale', 'en-US')
    await page.goto(url.toString(), { waitUntil: 'networkidle' })
    expect(page.url()).toMatch(/\/preview\/homepage/)
    await expect(page.getByText(/DRAFT:/i)).toBeVisible({ timeout: 10_000 })
  })
})

// ─── Direct preview page access via __pt URL param ────────────────────────────

test.describe('Direct preview page — __pt URL param', () => {
  test('valid __pt → preview page renders draft content', async ({ page }) => {
    const token = mintPreviewToken(E2E_DRAFT_SECRET)
    const previewUrl = buildDirectPreviewUrl('about-us', 'en', token)

    await page.goto(previewUrl, { waitUntil: 'networkidle' })

    await expect(page.getByText(/DRAFT:/i)).toBeVisible({ timeout: 10_000 })
  })

  test('missing __pt → 404', async ({ page }) => {
    const response = await page.goto('/preview/about-us', { waitUntil: 'networkidle' })
    expect(response?.status()).toBe(404)
    await expect(page.getByText('Page not found')).toBeVisible()
  })

  test('invalid __pt → 404', async ({ page }) => {
    const response = await page.goto(
      `${APP_BASE}/preview/about-us?__pt=invalid-token-xyz`,
      { waitUntil: 'networkidle' }
    )
    expect(response?.status()).toBe(404)
    await expect(page.getByText('Page not found')).toBeVisible()
  })

  test('expired __pt → 404', async ({ page }) => {
    const exp = String(Math.floor(Date.now() / 1000) - 1)
    const { createHmac } = await import('node:crypto')
    const sig = createHmac('sha256', E2E_DRAFT_SECRET).update(exp).digest('base64url')
    const expiredToken = `${exp}.${sig}`

    const response = await page.goto(
      `${APP_BASE}/preview/about-us?__pt=${encodeURIComponent(expiredToken)}`,
      { waitUntil: 'networkidle' }
    )
    expect(response?.status()).toBe(404)
    await expect(page.getByText('Page not found')).toBeVisible()
  })

  test('de locale preview via __pt → renders draft content in German', async ({ page }) => {
    const token = mintPreviewToken(E2E_DRAFT_SECRET)
    const previewUrl = buildDirectPreviewUrl('ueber-uns', 'de', token)

    await page.goto(previewUrl, { waitUntil: 'networkidle' })
    await expect(page.locator('html')).toHaveAttribute('lang', /^de/)
    await expect(page.getByText('DRAFT: Über Uns')).toBeVisible({ timeout: 10_000 })
  })
})

// ─── Cookie-driven preview on clean non-preview URLs ─────────────────────────

test.describe('Cookie-driven preview on clean non-preview URLs', () => {
  // The draft session cookie is established by navigating to a direct preview
  // URL (/preview/<slug>?__pt=<token>). The proxy's handlePreviewPath writes
  // a SameSite=Lax HttpOnly Set-Cookie header on that response. The browser
  // stores it and sends it on subsequent same-site navigations. Once the cookie
  // is in the jar, a navigation to a clean /locale/slug URL triggers the
  // isDraftActive=true branch in the proxy, which rewrites to the preview subtree.
  //
  // Probe slugs are used to guarantee a cold ISR cache — they are never
  // pre-rendered at build time and are served fresh on every request.

  test('active session cookie routes clean /<slug> to draft BFF call', async ({ page }) => {
    const slug = 'probe-cookie-en-clean'
    const token = mintPreviewToken(E2E_DRAFT_SECRET)

    // Navigate to the preview URL — proxy writes preview_token cookie.
    await page.goto(buildDirectPreviewUrl(slug, 'en', token), { waitUntil: 'networkidle' })
    // Wait for StripPreviewToken to remove __pt from the address bar.
    await page.waitForFunction(() => !window.location.search.includes('__pt='), { timeout: 5000 })

    // Navigate to the canonical clean URL. With localePrefix:'as-needed' the default
    // locale (en) has no prefix, so the canonical URL is /<slug> not /en/<slug>.
    // The browser sends the session cookie; the proxy reads it and routes to preview.
    await resetRequests()
    await page.goto(`/${slug}`, { waitUntil: 'networkidle' })

    const calls = await requestsFor(`/content/page/${slug}`)
    expect(calls.length).toBeGreaterThan(0)
    for (const call of calls) {
      expect(call.headers['x-next-draft-mode']).toBeTruthy()
    }
    await expect(page.getByText(/DRAFT:/i)).toBeVisible({ timeout: 10_000 })
  })

  test('active session cookie routes clean /de/<slug> to German draft BFF call', async ({
    page,
  }) => {
    const slug = 'probe-cookie-de-clean'
    const token = mintPreviewToken(E2E_DRAFT_SECRET)

    await page.goto(buildDirectPreviewUrl(slug, 'de', token), { waitUntil: 'networkidle' })
    await page.waitForFunction(() => !window.location.search.includes('__pt='), { timeout: 5000 })

    await resetRequests()
    await page.goto(`/de/${slug}`, { waitUntil: 'networkidle' })

    const calls = await requestsFor(`/content/page/${slug}`)
    expect(calls.length).toBeGreaterThan(0)
    for (const call of calls) {
      expect(call.headers['x-next-draft-mode']).toBeTruthy()
    }
    await expect(page.getByText(/DRAFT:/i)).toBeVisible({ timeout: 10_000 })
  })

  test('expired session cookie does not block a fresh ?__pt= preview link', async ({
    page,
    context,
  }) => {
    const exp = String(Math.floor(Date.now() / 1000) - 1)
    const { createHmac } = await import('node:crypto')
    const sig = createHmac('sha256', E2E_DRAFT_SECRET).update(exp).digest('base64url')
    const expiredToken = `${exp}.${sig}`

    await context.addCookies([
      {
        name: 'preview_token',
        value: expiredToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax' as const,
      },
    ])

    const freshToken = mintPreviewToken(E2E_DRAFT_SECRET)
    const previewUrl = buildDirectPreviewUrl('about-us', 'en', freshToken)
    await page.goto(previewUrl, { waitUntil: 'networkidle' })

    await expect(page.getByText(/DRAFT:/i)).toBeVisible({ timeout: 10_000 })
  })

  test('tampered far-future cookie is rejected — live page served, not a 404', async ({
    page,
    context,
  }) => {
    // A cookie whose exp is beyond the maximum issuable window is rejected by the
    // proxy. The user gets the live page rather than a 404 from failed HMAC validation.
    await context.addCookies([
      {
        name: 'preview_token',
        value: '99999999999.fakedsig',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax' as const,
      },
    ])

    await resetRequests()
    const response = await page.goto('/en/about-us', { waitUntil: 'networkidle' })

    expect(response?.status()).toBe(200)

    const calls = await requestsFor('/content/page/about-us')
    for (const call of calls) {
      expect(call.headers['x-next-draft-mode']).toBeFalsy()
    }

    await expect(page.getByText(/DRAFT:/i)).not.toBeVisible()
  })
})

// ─── __pt strip from address bar ─────────────────────────────────────────────

test.describe('__pt token stripped from address bar after preview page loads', () => {
  test('URL no longer contains __pt after the preview page loads', async ({ page }) => {
    const token = mintPreviewToken(E2E_DRAFT_SECRET)
    const previewUrl = buildDirectPreviewUrl('about-us', 'en', token)

    await page.goto(previewUrl, { waitUntil: 'networkidle' })
    // StripPreviewToken is a client component that calls router.replace() in a
    // useEffect after hydration. networkidle fires before hydration completes in
    // headless mode, so we must wait for the strip explicitly.
    await page.waitForFunction(() => !window.location.search.includes('__pt='), undefined, {
      timeout: 8000,
    })

    const finalUrl = page.url()
    expect(finalUrl, 'URL should not retain __pt after page load').not.toContain('__pt=')
    await expect(page.getByText(/DRAFT:/i)).toBeVisible({ timeout: 10_000 })
  })

  test('reload after strip still renders draft content (session cookie is active)', async ({
    page,
  }) => {
    const token = mintPreviewToken(E2E_DRAFT_SECRET)
    const previewUrl = buildDirectPreviewUrl('about-us', 'en', token)

    // First load: token in URL → proxy sets session cookie → StripPreviewToken strips __pt
    await page.goto(previewUrl, { waitUntil: 'networkidle' })
    // Wait for the client-side strip to execute
    await page.waitForFunction(() => !window.location.search.includes('__pt='), undefined, {
      timeout: 5000,
    })

    // Reload the clean URL — the session cookie should drive draft rendering
    await resetRequests()
    await page.reload({ waitUntil: 'networkidle' })

    await expect(page.getByText(/DRAFT:/i)).toBeVisible({ timeout: 10_000 })
  })
})
