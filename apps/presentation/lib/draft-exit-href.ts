import {
  I18N_CONFIG,
  getLocale,
  listLocales,
  PREVIEW_TOKEN_INTERNAL_PARAM,
} from '@config/constants'

const localePrefixes = new Set(listLocales().map((l) => l.urlPrefix))
const defaultLocalePrefix = getLocale(I18N_CONFIG.defaultLocale).urlPrefix

/** Builds the /api/draft/exit link that returns to the published version of the current page. */
export function buildExitHref(
  pathname: string,
  search: URLSearchParams
): string {
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
