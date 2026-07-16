/**
 * Shared helpers for e2e specs.
 *
 * mintPreviewToken()      — generates a signed token matching the app's validation logic.
 *                           Uses the same HMAC-SHA256(exp, secret) format as @core/draft-token
 *                           without importing that package, keeping the e2e workspace standalone.
 *
 * setDataSourceCookie()   — writes the data-source cookie the same way the demo selector does.
 *
 * resetRequests()         — clears the mock BFF's recorded request list.
 *
 * getRecordedRequests()   — fetches the full recorded request list from mock BFF.
 *
 * requestsFor()           — filters recorded requests to a path prefix.
 */

import { createHmac } from 'node:crypto'
import type { BrowserContext, Page } from '@playwright/test'
import { APP_BASE, APP_PORT, MOCK_BFF_BASE, E2E_DRAFT_SECRET } from '../config'
import type { RecordedRequest } from '../mock-bff/server'

// ─── Preview token helpers ────────────────────────────────────────────────────

/**
 * Mints a valid preview token accepted by the presentation app.
 * Mirrors the createDraftToken() logic from @core/draft-token.
 */
export function mintPreviewToken(
  secret = E2E_DRAFT_SECRET,
  maxAgeSec = 3600
): string {
  const exp = String(Math.floor(Date.now() / 1000) + maxAgeSec)
  const sig = createHmac('sha256', secret).update(exp).digest('base64url')
  return `${exp}.${sig}`
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

/** Writes the data-source cookie in exactly the same format as demo/data-source-selector. */
export async function setDataSourceCookie(
  context: BrowserContext,
  value: 'commercetools-set' | 'commercetools-algolia-set',
  domain = 'localhost'
) {
  await context.addCookies([
    {
      name: 'data-source',
      value,
      domain,
      path: '/',
      sameSite: 'Lax',
    },
  ])
}

// ─── Mock BFF inspection helpers ─────────────────────────────────────────────

/** Clears the recorded requests list. Call in beforeEach. */
export async function resetRequests() {
  const res = await fetch(`${MOCK_BFF_BASE}/__requests`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`resetRequests: ${res.status}`)
}

/** Returns all requests recorded since the last reset. */
export async function getRecordedRequests(): Promise<RecordedRequest[]> {
  const res = await fetch(`${MOCK_BFF_BASE}/__requests`)
  if (!res.ok) throw new Error(`getRecordedRequests: ${res.status}`)
  return res.json() as Promise<RecordedRequest[]>
}

/**
 * Returns recorded requests whose path starts with the given prefix.
 * Useful for asserting BFF calls for a specific resource, e.g.:
 *   requestsFor('/product/slug/blue-shirt')
 */
export async function requestsFor(pathPrefix: string): Promise<RecordedRequest[]> {
  const all = await getRecordedRequests()
  return all.filter((r) => r.path.startsWith(pathPrefix))
}

/**
 * Waits until at least one BFF request matching the path prefix has been
 * recorded.  Poll up to timeoutMs; resolves with the matching requests.
 */
export async function waitForBffRequest(
  page: Page,
  pathPrefix: string,
  timeoutMs = 5000
): Promise<RecordedRequest[]> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const hits = await requestsFor(pathPrefix)
    if (hits.length > 0) return hits
    await page.waitForTimeout(100)
  }
  throw new Error(`waitForBffRequest: no request for "${pathPrefix}" within ${timeoutMs}ms`)
}

// ─── ISR cache helpers ────────────────────────────────────────────────────────

/**
 * Flushes the Next.js in-memory Data Cache for all ISR BFF fetches by calling
 * the /api/e2e/revalidate endpoint (revalidateTag). Safe to call from beforeAll
 * in any spec — it is a no-op when the server is not in E2E_TEST mode.
 *
 * globalSetup calls this once at Playwright startup; specs with ISR assertions
 * call it again via beforeAll so reruns in UI mode (where globalSetup is NOT
 * re-executed) also get a cold cache.
 */
export async function revalidateBffCache(): Promise<void> {
  const res = await fetch(`http://127.0.0.1:${APP_PORT}/api/e2e/revalidate`)
  if (!res.ok) {
    throw new Error(`revalidateBffCache: ${res.status} ${await res.text()}`)
  }
}

// ─── Preview URL builder ──────────────────────────────────────────────────────

/**
 * Builds the URL the test should navigate to for a preview page, using the
 * HTTP path (i.e. __pt URL param — always on localhost which is HTTP).
 *
 * /api/draft handles: secret validation, slug normalisation, 307 redirect,
 * and __pt injection.  For direct preview page access in tests that bypass
 * /api/draft, use buildDirectPreviewUrl() below.
 */
export function buildDraftApiUrl(
  secret: string,
  slug: string,
  locale: string,
  baseUrl = APP_BASE
): string {
  const url = new URL('/api/draft', baseUrl)
  url.searchParams.set('secret', secret)
  url.searchParams.set('slug', slug)
  url.searchParams.set('locale', locale)
  return url.toString()
}

/**
 * Builds a direct /preview/... URL with ?__pt= for tests that don't go through
 * /api/draft (e.g. the iframe test, or when manually minting a token).
 *
 * For the default locale (en) the preview path is /preview/<slug>?__pt=<token>
 * (no locale prefix, matching localePrefix: 'as-needed').
 * For other locales: /<locale>/preview/<slug>?__pt=<token>.
 */
export function buildDirectPreviewUrl(
  slug: string,
  locale: 'en' | 'de',
  token: string,
  baseUrl = APP_BASE
): string {
  const path = locale === 'en' ? `/preview/${slug}` : `/${locale}/preview/${slug}`
  const url = new URL(path, baseUrl)
  url.searchParams.set('__pt', token)
  return url.toString()
}
