import { DEFAULT_CONTENT_REVALIDATE_SECONDS } from '@config/constants'

export type BffCacheOptions =
  | { cache: 'no-store' }
  | { next: { revalidate: number } }

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
  return { next: { revalidate: revalidateSeconds } }
}
