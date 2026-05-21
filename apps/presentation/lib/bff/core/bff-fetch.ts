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
import { I18N_CONFIG, urlPrefixToRfc } from '@config/constants'
import { AcceptLanguageUtils, LANGUAGE_HEADER } from '@core/i18n'
import { CORRELATION_ID_HEADER } from '@config/constants'
import {
  DRAFT_MODE_HEADER,
  getDraftModeHeaderValue,
  isDraftCookieValid,
  DRAFT_COOKIE_NAME,
} from '@/lib/draft-mode'

type BffFetchOptions = RequestInit

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
    cookies = await (await import('next/headers')).cookies()
  } else {
    rawCookieString = document.cookie
  }

  let isDraftMode = false
  if (typeof window === 'undefined' && cookies) {
    isDraftMode = isDraftCookieValid(cookies.get(DRAFT_COOKIE_NAME)?.value)
  }

  const cookieInput = cookies ?? rawCookieString ?? ''

  // Convert URL prefix back to RFC format for BFF
  const rfcLocale = locale ? urlPrefixToRfc(locale) : I18N_CONFIG.defaultLocale
  // Build Accept-Language header using the utility
  const acceptLanguageHeader =
    AcceptLanguageUtils.buildClientAcceptLanguageHeader(rfcLocale)

  const shouldIncludeCredentials = isSafeOrigin(url)

  const draftHeader = isDraftMode ? getDraftModeHeaderValue() : undefined

  const defaultOptions: BffFetchOptions = {
    ...options,
    ...(shouldIncludeCredentials && { credentials: 'include' }),
    headers: {
      'Content-Type': 'application/json',
      [LANGUAGE_HEADER]: acceptLanguageHeader,
      ...getDataSourceHeader(cookieInput),
      ...(correlationId && { [CORRELATION_ID_HEADER]: correlationId }),
      ...(draftHeader && { [DRAFT_MODE_HEADER]: draftHeader }),
      ...normalizeHeaders(options?.headers),
    },
  }
  return fetch(url, defaultOptions)
}
