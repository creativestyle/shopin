import { DEFAULT_CONTENT_REVALIDATE_SECONDS } from '@config/constants'

export type BffCacheOptions =
  | { cache: 'no-store' }
  | { next: { revalidate: number; tags?: string[] } }

/**
 * Cache tag shared by all ISR BFF fetches. Calling revalidateTag(BFF_DATA_CACHE_TAG)
 * flushes the entire in-memory Data Cache for live pages, which is needed by the
 * e2e /api/e2e/revalidate endpoint to guarantee cold cache hits on every test run
 * without restarting the Next.js server process.
 */
export const BFF_DATA_CACHE_TAG = 'bff-data'

/**
 * Returns fetch cache options for BFF requests.
 * Pass isDraft: true (from the preview route) to get no-store; otherwise returns revalidate.
 */
export function getBffCacheOptions(
  revalidateSeconds: number = DEFAULT_CONTENT_REVALIDATE_SECONDS,
  opts?: { isDraft?: boolean }
): BffCacheOptions {
  if (opts?.isDraft) {
    return { cache: 'no-store' }
  }
  return { next: { revalidate: revalidateSeconds, tags: [BFF_DATA_CACHE_TAG] } }
}
