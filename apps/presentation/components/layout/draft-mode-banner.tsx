'use client'

import { useId, useSyncExternalStore, type SyntheticEvent } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { PREVIEW_ACTIVE_COOKIE } from '@config/constants'
import { buildExitHref } from '@/lib/draft-exit-href'
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

function hasDraftMarkerCookie(): boolean {
  return document.cookie
    .split('; ')
    .some((c) => c === `${PREVIEW_ACTIVE_COOKIE}=1`)
}

/** Client-side gate for cacheable routes, which must not read cookies on the server. */
export function DraftModeSessionBanner() {
  // Re-render on navigation so the marker cookie is re-read per page
  usePathname()
  const isActive = useSyncExternalStore(
    subscribeNoop,
    hasDraftMarkerCookie,
    () => false
  )
  return isActive ? <DraftModeBanner /> : null
}
