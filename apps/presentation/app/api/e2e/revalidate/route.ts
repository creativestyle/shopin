import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { BFF_DATA_CACHE_TAG } from '@/lib/bff/bff-cache-options'

/**
 * Flushes the in-memory Next.js Data Cache for all ISR BFF fetches.
 * Called by the e2e global-setup before each test run so probe slugs are
 * always cold even when the server is reused across runs (reuseExistingServer: true).
 *
 * Only active when E2E_TEST=true (set in test/e2e/.env.e2e).
 */
export function GET() {
  if (process.env.E2E_TEST !== 'true') {
    return new NextResponse('Not found', { status: 404 })
  }
  // { expire: 0 } triggers immediate expiration (expired: Date.now()) in the
  // file-system cache handler, which is what the ISR tests require — the next
  // request for a tagged BFF fetch must hit the origin, not a stale in-memory
  // entry. A named profile (e.g. 'max') would only mark the entry as stale
  // (background revalidation) and would serve cached HTML to the first request.
  revalidateTag(BFF_DATA_CACHE_TAG, { expire: 0 })
  return new NextResponse('Cache revalidated', { status: 200 })
}
