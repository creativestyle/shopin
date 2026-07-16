/**
 * Draft preview uses no-store; live pages are ISR-cached.
 *
 * getBffCacheOptions(revalidateSeconds, { isDraft }) returns { cache: 'no-store' }
 * when isDraft:true, ensuring draft responses never land in the Data Cache under
 * the live key. The preview route is also force-dynamic so the Full Route Cache is
 * bypassed entirely.
 *
 * ISR verification strategy — count-based:
 *   Live page:   cold first request → ≥1 BFF calls; same URL second request → 0 BFF calls
 *   Draft page:  every request → ≥1 BFF calls (force-dynamic + no-store)
 *
 * Cold-URL guarantee:
 *   Each test uses a unique "probe-*" slug — a mock-BFF pattern that serves valid
 *   fixture data for ANY data source + draft combination, embedding the variant name
 *   in the fixture so content-level assertions remain possible.  Because probe slugs
 *   are never shared across tests. global-setup calls /api/e2e/revalidate before each
 *   run so no slug is ever warm at test start (reuseExistingServer: true).
 */

import { test, expect } from '../../fixtures'
import {
  mintPreviewToken,
  buildDirectPreviewUrl,
  resetRequests,
  requestsFor,
  revalidateBffCache,
} from '../../helpers'
import { E2E_DRAFT_SECRET } from '../../config'

// Flush the in-memory Data Cache before this spec runs. globalSetup does this
// at Playwright startup but not on subsequent reruns in UI mode, so we call it
// here as well to guarantee cold slugs on every run.
test.beforeAll(revalidateBffCache)

// Each test gets its own unique slug → guaranteed cold ISR hit within the run.
// Draft/preview slugs don't need uniqueness (force-dynamic, no ISR), but we keep
// them distinct anyway to aid in isolation when debugging.
const PROBE = {
  liveProduct: 'probe-isr-live-prod',
  liveProductHeader: 'probe-isr-live-prod-hdr',
  liveCollection: 'probe-isr-live-coll',
  liveContent: 'probe-isr-live-cont',
  draftContent: 'probe-isr-draft-cont',
  draftProduct: 'probe-isr-draft-prod',
  draftCollection: 'probe-isr-draft-coll',
}

// ─── Live pages: ISR caching ─────────────────────────────────────────────────

test.describe('Live pages are served from ISR cache on second load', () => {
  test('live product: second request has 0 BFF calls (served from Data Cache)', async ({
    page,
  }) => {
    // Cold first request — populates the Data Cache
    await page.goto(`/en/p/${PROBE.liveProduct}`)
    await page.waitForLoadState('networkidle')

    const coldCalls = await requestsFor(`/product/slug/${PROBE.liveProduct}`)
    expect(coldCalls.length, 'First load must produce at least one BFF call (cold hit)').toBeGreaterThan(0)

    // Reset and reload — should come from cache (0 BFF calls)
    await resetRequests()
    await page.goto(`/en/p/${PROBE.liveProduct}`)
    await page.waitForLoadState('networkidle')

    const calls = await requestsFor(`/product/slug/${PROBE.liveProduct}`)
    expect(calls.length, 'Second load should be served from Data Cache (0 upstream calls)').toBe(0)
    await expect(page.getByText(new RegExp(PROBE.liveProduct))).toBeVisible()
  })

  test('live collection: second request has 0 BFF calls', async ({ page }) => {
    await page.goto(`/en/c/${PROBE.liveCollection}`)
    await page.waitForLoadState('networkidle')

    const coldCalls = await requestsFor(`/productCollection/slug/${PROBE.liveCollection}`)
    expect(coldCalls.length, 'First load must produce at least one BFF call (cold hit)').toBeGreaterThan(0)

    await resetRequests()
    await page.goto(`/en/c/${PROBE.liveCollection}`)
    await page.waitForLoadState('networkidle')

    const calls = await requestsFor(`/productCollection/slug/${PROBE.liveCollection}`)
    expect(calls.length, 'Second live-collection load: expect 0 BFF calls (cached)').toBe(0)
    // Probe collections now render product items whose names also contain the probe slug,
    // so the regex matches 3 elements. .first() picks the (sr-only) category heading which
    // Playwright considers visible (1×1 px bounding box, no visibility:hidden).
    await expect(page.getByText(new RegExp(PROBE.liveCollection)).first()).toBeVisible()
  })

  test('German slug has a separate ISR cache entry from its English counterpart', async ({
    page,
  }) => {
    const EN_SLUG = PROBE.liveProduct
    const DE_SLUG = `de-${EN_SLUG}` // makeProbeProduct maps slugByLocale['de-DE'] = 'de-<slug>'

    // Ensure the English entry is warm (may already be from the preceding test)
    await page.goto(`/en/p/${EN_SLUG}`)
    await page.waitForLoadState('networkidle')

    // Loading the German counterpart must still call the BFF — the ISR cache key must
    // be locale-specific so English and German entries are stored independently.
    await resetRequests()
    await page.goto(`/de/p/${DE_SLUG}`)
    await page.waitForLoadState('networkidle')

    const calls = await requestsFor(`/product/slug/${DE_SLUG}`)
    expect(calls.length, 'German URL must hit BFF independently (separate ISR cache entry from English)').toBeGreaterThan(0)
    await expect(page.locator('html')).toHaveAttribute('lang', /^de/)
  })

  test('live content page: second request has 0 BFF calls', async ({ page }) => {
    await page.goto(`/en/${PROBE.liveContent}`)
    await page.waitForLoadState('networkidle')

    const coldCalls = await requestsFor(`/content/page/${PROBE.liveContent}`)
    expect(coldCalls.length, 'First load must produce at least one BFF call (cold hit)').toBeGreaterThan(0)

    await resetRequests()
    await page.goto(`/en/${PROBE.liveContent}`)
    await page.waitForLoadState('networkidle')

    const calls = await requestsFor(`/content/page/${PROBE.liveContent}`)
    expect(calls.length, 'Second live-content load: expect 0 BFF calls (cached)').toBe(0)
    await expect(page.getByText(new RegExp(PROBE.liveContent))).toBeVisible()
  })
})

test.describe('Live BFF calls carry the correct variant header, not the draft header', () => {
  test('live product page BFF call does NOT carry x-next-draft-mode', async ({ page }) => {
    await resetRequests()
    // Cold URL — will generate a BFF call
    await page.goto(`/en/p/${PROBE.liveProductHeader}`)
    await page.waitForLoadState('networkidle')

    const calls = await requestsFor(`/product/slug/${PROBE.liveProductHeader}`)
    expect(calls.length, 'Cold URL must produce at least one BFF call').toBeGreaterThan(0)

    for (const call of calls) {
      expect(
        call.headers['x-next-draft-mode'],
        `Live page BFF call should NOT carry x-next-draft-mode on path ${call.path}`
      ).toBeUndefined()
    }

    await expect(page.getByText(new RegExp(PROBE.liveProductHeader))).toBeVisible()
  })
})

// ─── Draft/preview pages: no-store (every load makes a fresh BFF call) ───────

test.describe('Draft preview pages bypass ISR cache (force-dynamic + no-store)', () => {
  test('draft content page: every request calls BFF (no-store)', async ({ page }) => {
    const token = mintPreviewToken(E2E_DRAFT_SECRET)
    const previewUrl = buildDirectPreviewUrl(PROBE.draftContent, 'en', token)

    await resetRequests()
    await page.goto(previewUrl)
    await page.waitForLoadState('networkidle')
    const first = (await requestsFor(`/content/page/${PROBE.draftContent}`)).length
    expect(first, 'First draft load must call BFF').toBeGreaterThan(0)

    await resetRequests()
    await page.goto(previewUrl)
    await page.waitForLoadState('networkidle')
    const second = (await requestsFor(`/content/page/${PROBE.draftContent}`)).length
    expect(second, 'Second draft load must call BFF again (no-store)').toBeGreaterThan(0)
    await expect(page.getByText(/DRAFT:/i)).toBeVisible()
  })

  test('draft product page: every request calls BFF', async ({ page }) => {
    const token = mintPreviewToken(E2E_DRAFT_SECRET)
    const previewUrl = buildDirectPreviewUrl(`p/${PROBE.draftProduct}`, 'en', token)

    await resetRequests()
    await page.goto(previewUrl)
    await page.waitForLoadState('networkidle')
    const first = (await requestsFor(`/product/slug/${PROBE.draftProduct}`)).length
    expect(first).toBeGreaterThan(0)

    await resetRequests()
    await page.goto(previewUrl)
    await page.waitForLoadState('networkidle')
    const second = (await requestsFor(`/product/slug/${PROBE.draftProduct}`)).length
    expect(second).toBeGreaterThan(0)
    await expect(page.getByText(/DRAFT:/i)).toBeVisible()
  })

  test('draft collection page: every request calls BFF', async ({ page }) => {
    const token = mintPreviewToken(E2E_DRAFT_SECRET)
    const previewUrl = buildDirectPreviewUrl(`c/${PROBE.draftCollection}`, 'en', token)

    await resetRequests()
    await page.goto(previewUrl)
    await page.waitForLoadState('networkidle')
    const first = (await requestsFor(`/productCollection/slug/${PROBE.draftCollection}`)).length
    expect(first).toBeGreaterThan(0)

    await resetRequests()
    await page.goto(previewUrl)
    await page.waitForLoadState('networkidle')
    const second = (await requestsFor(`/productCollection/slug/${PROBE.draftCollection}`)).length
    expect(second).toBeGreaterThan(0)
    // Probe collection product items also carry the DRAFT: prefix → 3 matches. .first() is safe.
    await expect(page.getByText(/DRAFT:/i).first()).toBeVisible()
  })

  test('draft product BFF calls carry x-next-draft-mode header', async ({ page }) => {
    const token = mintPreviewToken(E2E_DRAFT_SECRET)
    const previewUrl = buildDirectPreviewUrl(`p/${PROBE.draftProduct}`, 'en', token)

    await resetRequests()
    await page.goto(previewUrl)
    await page.waitForLoadState('networkidle')

    const calls = await requestsFor(`/product/slug/${PROBE.draftProduct}`)
    expect(calls.length).toBeGreaterThan(0)
    for (const call of calls) {
      expect(
        call.headers['x-next-draft-mode'],
        `Draft product BFF call on ${call.path} must carry x-next-draft-mode`
      ).toBeTruthy()
    }
    await expect(page.getByText(/DRAFT:/i)).toBeVisible()
  })

  test('draft collection BFF calls carry x-next-draft-mode header', async ({ page }) => {
    const token = mintPreviewToken(E2E_DRAFT_SECRET)
    const previewUrl = buildDirectPreviewUrl(`c/${PROBE.draftCollection}`, 'en', token)

    await resetRequests()
    await page.goto(previewUrl)
    await page.waitForLoadState('networkidle')

    const calls = await requestsFor(`/productCollection/slug/${PROBE.draftCollection}`)
    expect(calls.length).toBeGreaterThan(0)
    for (const call of calls) {
      expect(call.headers['x-next-draft-mode']).toBeTruthy()
    }
    // Probe collection product items also carry the DRAFT: prefix → 3 matches. .first() is safe.
    await expect(page.getByText(/DRAFT:/i).first()).toBeVisible()
  })

  test('draft product renders DRAFT: prefixed title (fixture divergence visible)', async ({
    page,
  }) => {
    const token = mintPreviewToken(E2E_DRAFT_SECRET)
    // Named slug so we hit the draft fixture that has "DRAFT:" prefix
    const previewUrl = buildDirectPreviewUrl('p/blue-shirt', 'en', token)

    await page.goto(previewUrl)
    await page.waitForLoadState('networkidle')

    // The draft fixture prefix "DRAFT:" must be visible somewhere on the page
    await expect(page.getByText(/DRAFT:/i)).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('DRAFT: Blue Shirt')).toBeVisible()
  })
})
