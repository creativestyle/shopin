'use client'

import { useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { resolveLocalizedPath } from './resolve-localized-path'
import {
  isVariantSegment,
  getVariantSegmentFromPathname,
} from '@/lib/variant/variant-key'

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

      const next = await resolveLocalizedPath({
        path: cleanPathname,
        targetUrlPrefix,
      })

      // Re-prepend the non-default variant prefix (null → default → no prefix).
      const variantSegment = getVariantSegmentFromPathname(pathname)
      const variantPrefix = variantSegment ? `/${variantSegment}` : ''
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
