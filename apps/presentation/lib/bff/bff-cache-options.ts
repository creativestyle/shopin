import { DEFAULT_CONTENT_REVALIDATE_SECONDS } from '@config/constants'
import { isDraftModeEnabled } from '@/lib/draft-mode'

export type BffCacheOptions =
  | { cache: 'no-store' }
  | { next: { revalidate: number } }

export type BffCacheOptionsWithDraft = BffCacheOptions & { isDraft: boolean }

/**
 * Returns fetch cache options for BFF requests based on draft mode, plus the isDraft flag.
 * When draft mode is enabled (valid signed cookie from /api/draft), returns no-store and isDraft: true.
 * Otherwise returns revalidate and isDraft: false.
 * Use the returned options for fetch; use isDraft when you need the flag (e.g. noStore() in a page).
 */
export async function getBffCacheOptions(
  revalidateSeconds: number = DEFAULT_CONTENT_REVALIDATE_SECONDS
): Promise<BffCacheOptionsWithDraft> {
  const isDraft = await isDraftModeEnabled()
  const options: BffCacheOptions = isDraft
    ? ({ cache: 'no-store' } as const)
    : { next: { revalidate: revalidateSeconds } }
  return { ...options, isDraft }
}
