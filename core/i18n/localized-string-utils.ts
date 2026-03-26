import { I18N_CONFIG } from '@config/constants'

/**
 * Resolve a value from a localized string map (Record<string, string>).
 * Tries: exact language → fallback language → first available key.
 */
export function getLocalizedString(
  localizedValue: Record<string, string> | undefined,
  currentLanguage: string
): string | undefined {
  if (!localizedValue) {
    return undefined
  }

  const fallbackLocale = I18N_CONFIG.fallbackLanguage

  let selectedValue = localizedValue[currentLanguage]
  if (!selectedValue) {
    selectedValue = localizedValue[fallbackLocale]
  }
  if (!selectedValue) {
    const firstKey = Object.keys(localizedValue)[0]
    if (firstKey) {
      selectedValue = localizedValue[firstKey]
    }
  }
  return selectedValue
}
