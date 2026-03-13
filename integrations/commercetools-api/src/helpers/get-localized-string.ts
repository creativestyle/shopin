import type { LocalizedStringApiResponse } from '../schemas/localized-string'
import { I18N_CONFIG } from '@config/constants'

export function getLocalizedString(
  localizedValue: LocalizedStringApiResponse | undefined,
  currentLanguage: string
): string | undefined {
  if (!localizedValue) {
    return undefined
  }
  const dataLocale = currentLanguage
  const fallbackLocale = I18N_CONFIG.fallbackLanguage

  let selectedValue = localizedValue[dataLocale]
  if (!selectedValue) {
    selectedValue = localizedValue[fallbackLocale]
  }
  if (!selectedValue) {
    const availableLanguages = Object.keys(localizedValue)
    if (availableLanguages.length > 0) {
      selectedValue = localizedValue[availableLanguages[0]]
    }
  }
  return selectedValue
}
