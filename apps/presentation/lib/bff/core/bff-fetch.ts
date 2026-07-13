/**
 * Core BFF fetch utility
 *
 * This module provides the core fetch wrapper that handles:
 * - Data source headers
 * - Language headers
 * - Cookie handling
 * - Request formatting
 *
 * The baseUrl parameter is provided by the calling code (server or client)
 */

import { I18N_CONFIG, urlPrefixToRfc } from '@config/constants'
import { AcceptLanguageUtils, LANGUAGE_HEADER } from '@core/i18n'
import { CORRELATION_ID_HEADER } from '@config/constants'
import { DRAFT_MODE_HEADER, getDraftModeHeaderValue } from '@/lib/draft-mode'

export type BffFetchOptions = RequestInit & {
  /** Explicitly enable draft mode (preview route). When true, adds the draft header. */
  isDraft?: boolean
  /** Resolved variant headers (e.g. X-Data-Source). Set by server-side callers from the URL
   *  [variant] segment and by the client from the active pathname. When absent the BFF defaults
   *  to the default data source (commercetools-set). */
  variantHeaders?: Record<string, string>
}

type HeadersInput =
  | Headers
  | Record<string, string>
  | [string, string][]
  | undefined

function normalizeHeaders(headers: HeadersInput): Record<string, string> {
  if (headers == null) {
    return {}
  }
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries())
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers)
  }
  return { ...headers }
}

function isSafeOrigin(url: string): boolean {
  try {
    const expectedUrl = process.env.NEXT_PUBLIC_BFF_EXTERNAL_URL
    if (!expectedUrl) {
      return false
    }

    const urlObj = new URL(url)
    const expectedUrlObj = new URL(expectedUrl)

    return urlObj.origin === expectedUrlObj.origin
  } catch {
    return false
  }
}

/**
 * Fetch wrapper for BFF requests
 * Handles data source headers and language headers
 *
 * @param baseUrl - Base URL for the BFF (determined by caller)
 * @param path - API path (e.g., 'navigation/getNavigation')
 * @param options - Fetch options (headers, body, etc.)
 * @param locale - Locale to send in header (should come from context)
 * @param correlationId - Correlation ID propagated to BFF when provided (for trace continuity)
 */
export async function bffFetch(
  baseUrl: string,
  path: string,
  options?: BffFetchOptions,
  locale?: string,
  correlationId?: string
): Promise<Response> {
  const base = baseUrl.replace(/\/+$/, '') // no trailing slash so base + path never has double slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = `${base}${normalizedPath}`

  // Draft mode is explicit — never inferred from cookies or request context.
  const isDraftMode = options?.isDraft ?? false

  // Convert URL prefix back to RFC format for BFF
  const rfcLocale = locale ? urlPrefixToRfc(locale) : I18N_CONFIG.defaultLocale
  // Build Accept-Language header using the utility
  const acceptLanguageHeader =
    AcceptLanguageUtils.buildClientAcceptLanguageHeader(rfcLocale)

  const shouldIncludeCredentials = isSafeOrigin(url)

  const draftHeader = isDraftMode ? getDraftModeHeaderValue() : undefined

  // Variant headers are always explicit: server renders get them from the [variant] URL
  // segment (via bff-fetch-server → getRequestVariant → variantHeaders); client renders
  // get them from usePathname() via bff-fetch-client. When absent, the BFF falls
  // back to its own default (commercetools-set) — correct for clean public URLs.
  const headersFromVariant = options?.variantHeaders ?? {}

  const defaultOptions: BffFetchOptions = {
    ...options,
    ...(shouldIncludeCredentials && { credentials: 'include' }),
    headers: {
      'Content-Type': 'application/json',
      [LANGUAGE_HEADER]: acceptLanguageHeader,
      ...headersFromVariant,
      ...(correlationId && { [CORRELATION_ID_HEADER]: correlationId }),
      ...(draftHeader && { [DRAFT_MODE_HEADER]: draftHeader }),
      ...normalizeHeaders(options?.headers),
    },
  }
  return fetch(url, defaultOptions)
}
