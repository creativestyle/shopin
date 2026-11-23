'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PREVIEW_TOKEN_INTERNAL_PARAM } from '@config/constants'

/**
 * Strips the __pt token from the address bar after the preview page mounts.
 *
 * The server has already read and validated the token (it is in the URL only
 * on HTTP/local-dev; on HTTPS the token arrives via HttpOnly cookie only and
 * never appears in the URL). The proxy establishes a preview_token session
 * cookie when it processes a /preview/ request, so reloading without __pt is
 * safe — the cookie carries the session. Skipped inside an iframe, where that
 * cookie may be rejected and stripping would turn the page into a 404.
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
    // In a cross-site iframe (CMS live preview) the HTTP session cookie is rejected, so __pt is the only credential
    if (window.self !== window.top) {
      return
    }
    const url = new URL(window.location.href)
    if (url.searchParams.has(PREVIEW_TOKEN_INTERNAL_PARAM)) {
      url.searchParams.delete(PREVIEW_TOKEN_INTERNAL_PARAM)
      router.replace(url.pathname + url.search, { scroll: false })
    }
  }, [router])

  return null
}
