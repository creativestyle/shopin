import { getFakeCmsServer } from './fake-cms/server'
import { readRunLog, RUN_ID } from './journeys/support/run'
import { isMockRun, resolveIntegrations } from './stack/integration-choice'

/** On another integration than the mock: what the run cleaned up, and what it could not. */
function reportCleanup() {
  if (isMockRun(resolveIntegrations())) {
    return
  }
  const entries = readRunLog()
  const cleaned = (kind: string) =>
    entries.filter((entry) => entry.kind === kind && entry.cleaned).length
  console.log(
    `[e2e] Cleanup of run ${RUN_ID}: emptied ${cleaned('cart')} carts and ${cleaned('wishlist')} wishlists`
  )
  const left = entries.filter((entry) => !entry.cleaned)
  if (left.length) {
    console.log('[e2e] Not deleted:')
    for (const entry of left) {
      console.log(`[e2e]   ${entry.kind} ${entry.id}: ${entry.reason}`)
    }
  }
  console.log(`[e2e] Orders stay; their e-mail addresses carry ${RUN_ID}`)
}

export default async function globalTeardown() {
  reportCleanup()
  await new Promise<void>((resolve) =>
    getFakeCmsServer().close(() => resolve())
  )
}
