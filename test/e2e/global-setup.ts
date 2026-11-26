/**
 * Playwright globalSetup: resets the mock, reports the integrations from the
 * BFF, flushes the Next.js Data Cache and starts the fake-CMS server.
 *
 * The recording mock BFF is managed as a Playwright webServer entry
 * (playwright.config.ts) so it is guaranteed to be running before the
 * Next.js server receives its first readiness-probe request.
 */

import { getFakeCmsServer } from './fake-cms/server'
import { FAKE_CMS_PORT, APP_PORT, BFF_URL, USES_EXTERNAL_STACK } from './config'
import { RESET_MOCK_PATH } from './fault-proxy/server'
import { RUN_ID } from './journeys/support/run'
import {
  fetchCapabilities,
  formatCapabilitiesReport,
  isMockRun,
  resolveIntegrations,
} from './stack/integration-choice'

export default async function globalSetup() {
  const integrations = resolveIntegrations()
  console.log(`[e2e] Run id: ${RUN_ID}`)

  // Each run starts the mock over, also on a stack reused from an earlier run
  if (!USES_EXTERNAL_STACK && isMockRun(integrations)) {
    const reset = await fetch(`${new URL(BFF_URL).origin}${RESET_MOCK_PATH}`, {
      method: 'POST',
    })
    if (!reset.ok) {
      throw new Error(
        `[e2e] Mock reset failed: ${reset.status} ${await reset.text()}`
      )
    }
    console.log('[e2e] Mock stores reset')
  }

  // Which integration served each category, as the BFF reports it
  console.log(
    formatCapabilitiesReport(
      await fetchCapabilities(BFF_URL, integrations.dataSource)
    )
  )

  // Flush both the in-memory Data Cache and on-disk fetch-cache entries.
  // revalidateTag('*', { expire: 0 }) sets expired = Date.now() on every entry
  // (Next.js file-system-cache.js), so the next request treats them as cold —
  // no rm -rf needed.
  const revalidateUrl = `http://127.0.0.1:${APP_PORT}/api/e2e/revalidate`
  const res = await fetch(revalidateUrl)
  if (!res.ok) {
    throw new Error(
      `[e2e] Cache revalidation failed: ${res.status} ${await res.text()}`
    )
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
