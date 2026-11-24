'use client'

import {
  useId,
  useLayoutEffect,
  useSyncExternalStore,
  type SyntheticEvent,
} from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { buildExitHref } from '@/lib/draft-exit-href'
import {
  DRAFT_SESSION_ATTRIBUTE,
  hasDraftMarkerCookie,
} from '@/lib/draft-session-marker'
import { StandardContainer } from '@/components/ui/standard-container'

const subscribeNoop = () => () => {}

// Inside the CMS live-preview iframe, exiting would swap the editor's pane to published content
function isFramed(): boolean {
  return window.self !== window.top
}

export function DraftModeBanner() {
  const t = useTranslations('draftMode')
  const pathname = usePathname()
  const labelId = useId()
  const framed = useSyncExternalStore(subscribeNoop, isFramed, () => false)

  // Query read at interaction time: useSearchParams would need Suspense and hydrate late
  const refreshHref = (e: SyntheticEvent<HTMLAnchorElement>) => {
    e.currentTarget.href = buildExitHref(
      pathname,
      new URLSearchParams(window.location.search)
    )
  }

  return (
    <section
      aria-labelledby={labelId}
      className='bg-yellow-500 text-gray-900'
    >
      <StandardContainer className='flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-2 text-center text-xs'>
        <p
          id={labelId}
          className='font-medium'
        >
          {t('label')}
        </p>
        {/* Plain anchor: the exit route handler must run to clear the HttpOnly cookie */}
        {!framed && (
          <a
            href={buildExitHref(pathname, new URLSearchParams())}
            // In every cached page's HTML; keep crawlers off the exit route
            rel='nofollow'
            onClick={refreshHref}
            onAuxClick={refreshHref}
            onContextMenu={refreshHref}
            className='font-semibold underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:outline-none'
          >
            {t('exit')}
          </a>
        )}
      </StandardContainer>
    </section>
  )
}

/** Cacheable routes: always rendered, shown by CSS once the inline script marks <html>. */
export function DraftModeSessionBanner() {
  const pathname = usePathname()
  // Re-sync per navigation (session expiry) and after the dev Strict Mode remount clears it
  useLayoutEffect(() => {
    document.documentElement.toggleAttribute(
      DRAFT_SESSION_ATTRIBUTE,
      hasDraftMarkerCookie(document.cookie)
    )
  }, [pathname])

  // The variant selector must match DRAFT_SESSION_ATTRIBUTE
  return (
    <div className='hidden [[data-draft-session]_&]:block'>
      <DraftModeBanner />
    </div>
  )
}
