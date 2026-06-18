'use client'

import { useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { resolveLocalizedPath } from './resolve-localized-path'
import {
  isVariantSegment,
  getVariantSegmentFromPathname,
} from '@/lib/variant/variant-key'
import { getActiveVariantSegment } from '@/lib/variant/active-variant-client'

export function useLocaleSwitcher() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, setIsPending] = useState(false)

  async function switchTo(targetUrlPrefix: string) {
    if (isPending) {
      return
    }
    setIsPending(true)
    try {
      // Strip the variant segment from the pathname before resolving the localized
      // path (resolveLocalizedPath expects a clean locale-prefixed path).
      // Re-apply the segment afterwards so the user stays on the same variant.
      const segments = pathname.split('/').filter(Boolean)
      const hasVariantPrefix =
        segments.length > 0 && isVariantSegment(segments[0])
      const cleanPathname = hasVariantPrefix
        ? '/' + segments.slice(1).join('/')
        : pathname

      // Extract variant from the URL segment first (alt-variant ~ URL); fall back to
      // reading the preference cookie so that slug resolution uses the correct catalog
      // even on clean alt-cookie URLs where the ~ segment is invisible to the browser.
      // The resolutionVariantSegment is passed to the server action ONLY for the BFF
      // slug lookup; the URL prefix uses pathVariantSegment so the address bar stays
      // clean (no ~ prefix on redirect).
      const pathVariantSegment = getVariantSegmentFromPathname(pathname)
      const resolutionVariantSegment =
        pathVariantSegment ?? getActiveVariantSegment(pathname)
      const next = await resolveLocalizedPath({
        path: cleanPathname,
        targetUrlPrefix,
        variantSegment: resolutionVariantSegment,
      })

      // Re-prepend only when the current URL already carries a ~ variant prefix
      // (alt-variant ~ URL). For clean URLs (cookie-based variant) keep the result
      // clean — the cookie drives the internal rewrite on the follow-up request.
      const variantPrefix = pathVariantSegment ? `/${pathVariantSegment}` : ''
      const final = variantPrefix + next

      const qs = searchParams.toString()
      // Hard navigation ensures the intl context fully reloads for the new locale,
      // preventing stale state when using the browser back button.
      window.location.assign(qs ? `${final}?${qs}` : final)
    } finally {
      setIsPending(false)
    }
  }

  return { switchTo, isPending }
}
