'use client'

import { useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { resolveLocalizedPath } from './resolve-localized-path'

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
      const next = await resolveLocalizedPath({
        path: pathname,
        targetUrlPrefix,
      })
      const qs = searchParams.toString()
      // Hard navigation ensures the intl context fully reloads for the new locale,
      // preventing stale state when using the browser back button.
      window.location.assign(qs ? `${next}?${qs}` : next)
    } finally {
      setIsPending(false)
    }
  }

  return { switchTo, isPending }
}
