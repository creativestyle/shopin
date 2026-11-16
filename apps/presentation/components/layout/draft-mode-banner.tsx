'use client'

import { useId, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { I18N_CONFIG, getLocale, listLocales } from '@config/constants'
import {
  PREVIEW_ACTIVE_COOKIE,
  PREVIEW_TOKEN_INTERNAL_PARAM,
} from '@/lib/draft-mode'
import { StandardContainer } from '@/components/ui/standard-container'

const localePrefixes = new Set(listLocales().map((l) => l.urlPrefix))
const defaultLocalePrefix = getLocale(I18N_CONFIG.defaultLocale).urlPrefix

function buildExitHref(pathname: string, search: URLSearchParams): string {
  const segments = pathname.split('/').filter(Boolean)
  const locale =
    segments[0] && localePrefixes.has(segments[0])
      ? segments.shift()!
      : defaultLocalePrefix
  if (segments[0] === 'preview') {
    segments.shift()
  }
  const params = new URLSearchParams(search)
  params.delete(PREVIEW_TOKEN_INTERNAL_PARAM)
  params.set('locale', locale)
  params.set('slug', segments.join('/'))
  return `/api/draft/exit?${params.toString()}`
}

export function DraftModeBanner() {
  const t = useTranslations('draftMode')
  const pathname = usePathname()
  const labelId = useId()

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
        <a
          href={buildExitHref(pathname, new URLSearchParams())}
          onClick={(e) => {
            // Query read at click time: useSearchParams would need Suspense and hydrate late
            e.currentTarget.href = buildExitHref(
              pathname,
              new URLSearchParams(window.location.search)
            )
          }}
          className='font-semibold underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:outline-none'
        >
          {t('exit')}
        </a>
      </StandardContainer>
    </section>
  )
}

const subscribeNoop = () => () => {}

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
