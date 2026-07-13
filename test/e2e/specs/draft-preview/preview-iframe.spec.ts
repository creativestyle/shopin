/**
 * Preview works when embedded cross-origin in a CMS iframe.
 *
 * On HTTP (local dev) the token is delivered as ?__pt= URL param, which has no
 * SameSite restriction and works in all embedding contexts including HTTP localhost.
 * On HTTPS (production) the cookie is SameSite=None;Secure — verified by the Jest
 * unit test in apps/presentation/app/api/draft/__tests__/route.test.ts, because
 * verifying it e2e would require TLS setup.
 *
 * Cross-origin setup:
 *   Fake CMS server: http://localhost:3002  (FAKE_CMS_PORT)
 *   App preview:     http://localhost:3100  (APP_PORT — dedicated e2e port)
 * The iframe is genuinely cross-origin between 3002 and 3100.
 */

import { test, expect } from '../../fixtures'
import {
  mintPreviewToken,
  buildDirectPreviewUrl,
  resetRequests,
  waitForBffRequest,
} from '../../helpers'
import { APP_BASE, E2E_DRAFT_SECRET, FAKE_CMS_BASE } from '../../config'

test.describe('Cross-origin iframe preview', () => {
  test('preview page renders draft content when loaded in a cross-origin iframe via __pt param', async ({
    page,
  }) => {
    const token = mintPreviewToken(E2E_DRAFT_SECRET)
    const previewUrl = buildDirectPreviewUrl('about-us', 'en', token)

    const fakeCmsUrl = `${FAKE_CMS_BASE}/preview?url=${encodeURIComponent(previewUrl)}`

    await resetRequests()
    await page.goto(fakeCmsUrl, { waitUntil: 'networkidle' })

    const frame = page.frameLocator('iframe#preview-frame')
    await expect(frame.getByText(/DRAFT:/i)).toBeVisible({ timeout: 15_000 })
  })

  test('iframe preview BFF calls carry x-next-draft-mode header', async ({ page }) => {
    const token = mintPreviewToken(E2E_DRAFT_SECRET)
    const previewUrl = buildDirectPreviewUrl('about-us', 'en', token)
    const fakeCmsUrl = `${FAKE_CMS_BASE}/preview?url=${encodeURIComponent(previewUrl)}`

    await resetRequests()
    await page.goto(fakeCmsUrl, { waitUntil: 'networkidle' })

    const calls = await waitForBffRequest(page, '/content/page/about-us', 10_000)
    expect(calls.length).toBeGreaterThan(0)
    for (const call of calls) {
      expect(call.headers['x-next-draft-mode']).toBeTruthy()
    }
  })

  test('iframe preview with invalid token shows 404 (not live content)', async ({ page }) => {
    // Use APP_BASE so the URL is always on the correct e2e port (3100)
    const previewUrl = `${APP_BASE}/preview/about-us?__pt=invalid-token`
    const fakeCmsUrl = `${FAKE_CMS_BASE}/preview?url=${encodeURIComponent(previewUrl)}`

    await page.goto(fakeCmsUrl, { waitUntil: 'networkidle' })

    const frame = page.frameLocator('iframe#preview-frame')
    await expect(frame.getByText('Page not found')).toBeVisible({ timeout: 10_000 })
    await expect(frame.getByText(/DRAFT:/i)).not.toBeVisible()
  })

  test('iframe preview with expired token shows 404 (not live content)', async ({ page }) => {
    const exp = String(Math.floor(Date.now() / 1000) - 1)
    const { createHmac } = await import('node:crypto')
    const sig = createHmac('sha256', E2E_DRAFT_SECRET).update(exp).digest('base64url')
    const expiredToken = `${exp}.${sig}`

    const previewUrl = `${APP_BASE}/preview/about-us?__pt=${encodeURIComponent(expiredToken)}`
    const fakeCmsUrl = `${FAKE_CMS_BASE}/preview?url=${encodeURIComponent(previewUrl)}`

    await page.goto(fakeCmsUrl, { waitUntil: 'networkidle' })

    const frame = page.frameLocator('iframe#preview-frame')
    await expect(frame.getByText('Page not found')).toBeVisible({ timeout: 10_000 })
    await expect(frame.getByText(/DRAFT:/i)).not.toBeVisible()
  })
})
