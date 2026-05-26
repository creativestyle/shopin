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

import { getDataSourceHeader } from '@demo/data-source-selector'
import { I18N_CONFIG, urlPrefixToRfc, type DataSource } from '@config/constants'
import { AcceptLanguageUtils, LANGUAGE_HEADER } from '@core/i18n'
import { CORRELATION_ID_HEADER } from '@config/constants'
import { DRAFT_MODE_HEADER, getDraftModeHeaderValue } from '@/lib/draft-mode'

type BffFetchOptions = RequestInit & {
  /** Skip server-side cookies() access. Use for ISR-cacheable fetches (CMS chrome, navigation, store-config). */
  skipServerCookies?: boolean
  /** Explicitly enable draft mode (preview route). When true, adds the draft header without reading cookies. */
  isDraft?: boolean
  /** Explicit data source — bypasses cookie parsing. Set by server-side callers that read from the URL segment. */
  dataSource?: DataSource
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

  let cookies:
    | Awaited<ReturnType<(typeof import('next/headers'))['cookies']>>
    | undefined
  let rawCookieString: string | undefined

  if (typeof window === 'undefined') {
    if (!options?.skipServerCookies) {
      try {
        cookies = await (await import('next/headers')).cookies()
      } catch {
        // Unavailable at build time — draft and data-source headers use safe defaults
      }
    }
  } else {
    rawCookieString = document.cookie
  }

  // Draft mode is now explicit — never inferred from cookies
  const isDraftMode = options?.isDraft ?? false

  const cookieInput = cookies ?? rawCookieString ?? ''

  // Convert URL prefix back to RFC format for BFF
  const rfcLocale = locale ? urlPrefixToRfc(locale) : I18N_CONFIG.defaultLocale
  // Build Accept-Language header using the utility
  const acceptLanguageHeader =
    AcceptLanguageUtils.buildClientAcceptLanguageHeader(rfcLocale)

  const shouldIncludeCredentials = isSafeOrigin(url)

  const draftHeader = isDraftMode ? getDraftModeHeaderValue() : undefined

  const dataSourceHeaders = options?.dataSource
    ? { 'X-Data-Source': options.dataSource }
    : getDataSourceHeader(cookieInput)

  const defaultOptions: BffFetchOptions = {
    ...options,
    ...(shouldIncludeCredentials && { credentials: 'include' }),
    headers: {
      'Content-Type': 'application/json',
      [LANGUAGE_HEADER]: acceptLanguageHeader,
      ...dataSourceHeaders,
      ...(correlationId && { [CORRELATION_ID_HEADER]: correlationId }),
      ...(draftHeader && { [DRAFT_MODE_HEADER]: draftHeader }),
      ...normalizeHeaders(options?.headers),
    },
  }
  return fetch(url, defaultOptions)
}
