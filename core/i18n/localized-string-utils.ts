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

  return (
    localizedValue[currentLanguage] ??
    localizedValue[I18N_CONFIG.fallbackLanguage] ??
    Object.values(localizedValue)[0]
  )
}
