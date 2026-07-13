'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PREVIEW_TOKEN_INTERNAL_PARAM } from '@/lib/draft-mode'

/**
 * Strips the __pt token from the address bar after the preview page mounts.
 *
 * The server has already read and validated the token (it is in the URL only
 * on HTTP/local-dev; on HTTPS the token arrives via HttpOnly cookie only and
 * never appears in the URL). The proxy establishes a preview_token session
 * cookie when it processes a /preview/ request, so reloading without __pt is
 * safe — the cookie carries the session.
 *
 * Uses router.replace() instead of history.replaceState() to keep the Next.js
 * App Router's internal state in sync with the address bar. This prevents
 * stale-URL artifacts that can cause spurious navigations when links are clicked.
 *
 * Renders nothing; placed once in the preview layout.
 */
export function StripPreviewToken() {
  const router = useRouter()
  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.has(PREVIEW_TOKEN_INTERNAL_PARAM)) {
      url.searchParams.delete(PREVIEW_TOKEN_INTERNAL_PARAM)
      router.replace(url.pathname + url.search, { scroll: false })
    }
  }, [router])

  return null
}
