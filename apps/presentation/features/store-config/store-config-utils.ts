import type { useTranslations } from 'next-intl'

/**
 * Gets the translated label for a country code
 * @param country - Two-letter country code (e.g., 'PL', 'DE')
 * @param tCommon - Translation function from useTranslations('common')
 * @returns Translated country name
 */
export function getCountryLabel(
  country: string,
  tCommon: ReturnType<typeof useTranslations<'common'>>
): string {
  const key = `countries.${country}` as Parameters<typeof tCommon>[0]
  return tCommon(key)
}
