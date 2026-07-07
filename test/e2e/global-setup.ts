/**
 * Playwright globalSetup: flushes the Next.js Data Cache and starts the fake-CMS server.
 *
 * The recording mock BFF is managed as a Playwright webServer entry
 * (playwright.config.ts) so it is guaranteed to be running before the
 * Next.js server receives its first readiness-probe request.
 */

import { getFakeCmsServer } from './fake-cms/server'
import { FAKE_CMS_PORT, APP_PORT } from './config'

export default async function globalSetup() {
  // Flush both the in-memory Data Cache and on-disk fetch-cache entries.
  // revalidateTag('*', { expire: 0 }) sets expired = Date.now() on every entry
  // (Next.js file-system-cache.js), so the next request treats them as cold —
  // no rm -rf needed.
  const revalidateUrl = `http://127.0.0.1:${APP_PORT}/api/e2e/revalidate`
  const res = await fetch(revalidateUrl)
  if (!res.ok) {
    throw new Error(`[e2e] Cache revalidation failed: ${res.status} ${await res.text()}`)
  }
  console.log('[e2e] In-memory BFF Data Cache revalidated')

  // Start fake CMS for cross-origin iframe preview test
  const fakeCms = getFakeCmsServer()
  await new Promise<void>((resolve, reject) => {
    fakeCms.once('error', reject)
    fakeCms.listen(FAKE_CMS_PORT, resolve)
  })
  console.log(`[e2e] Fake CMS listening on port ${FAKE_CMS_PORT}`)
}
