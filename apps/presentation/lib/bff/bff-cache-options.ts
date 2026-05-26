import { DEFAULT_CONTENT_REVALIDATE_SECONDS } from '@config/constants'

export type BffCacheOptions =
  | { cache: 'no-store' }
  | { next: { revalidate: number } }

export type BffCacheOptionsWithDraft = BffCacheOptions & { isDraft: boolean }

/**
 * Returns fetch cache options for BFF requests, plus the isDraft flag.
 * Pass isDraft: true (from the preview route) to get no-store; otherwise returns revalidate.
 */
export function getBffCacheOptions(
  revalidateSeconds: number = DEFAULT_CONTENT_REVALIDATE_SECONDS,
  opts?: { isDraft?: boolean }
): BffCacheOptionsWithDraft {
  if (opts?.isDraft) {
    return { cache: 'no-store', isDraft: true }
  }
  return { next: { revalidate: revalidateSeconds }, isDraft: false }
}
