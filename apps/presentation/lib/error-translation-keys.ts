/**
 * Common error translation keys and helper shared across features.
 *
 * Use this when a feature needs to map HTTP status codes to translation keys
 * (e.g. for forms that show different messages per status). Spread COMMON_ERROR_KEYS
 * and add feature-specific keys, then use createErrorTranslationKeyGetter to build
 * a getter. Auth is an example: see features/auth/lib/error-translations.ts.
 */

import { HttpError } from './error-utils'

export function createErrorTranslationKeyGetter<T extends string>(
  translationKeyMap: Record<number, T>
): (statusCode: number) => T {
  return (statusCode: number) => {
    return translationKeyMap[statusCode] ?? translationKeyMap[500]
  }
}

/** Status codes and keys shared across features (validation, rate limit, server error). */
export const COMMON_ERROR_KEYS = {
  400: 'errors.validationFailed',
  429: 'errors.tooManyRequests',
  500: 'errors.internalServerError',
} as const

export type CommonErrorTranslationKey =
  (typeof COMMON_ERROR_KEYS)[keyof typeof COMMON_ERROR_KEYS]

/**
 * Returns the common translation key for a status code, or undefined if not in COMMON_ERROR_KEYS.
 * Use this in server components or any place you need a message for a known status (e.g. 429).
 */
export function getCommonErrorTranslationKey(
  statusCode: number
): CommonErrorTranslationKey | undefined {
  return statusCode in COMMON_ERROR_KEYS
    ? (COMMON_ERROR_KEYS as Record<number, CommonErrorTranslationKey>)[
        statusCode
      ]
    : undefined
}

/**
 * Server components: catch (err) { error = await getCommonErrorMessage(err, () => getTranslations('common')) }
 * 400/429/500 → common message; anything else → common.errors.internalServerError. One fallback only.
 */
export async function getCommonErrorMessage(
  error: unknown,
  getTCommon: () => Promise<(key: CommonErrorTranslationKey) => string>
): Promise<string> {
  const statusCode = HttpError.getStatusCode(error)
  const commonKey =
    statusCode !== null ? getCommonErrorTranslationKey(statusCode) : undefined
  const tCommon = await getTCommon()
  return commonKey ? tCommon(commonKey) : tCommon('errors.internalServerError')
}
