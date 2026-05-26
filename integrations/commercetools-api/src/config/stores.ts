import type { SupportedLocale } from '@config/constants'
import { I18N_CONFIG, getLocale } from '@config/constants'

function parseStoreKeys(raw: string): Map<SupportedLocale, string> {
  const map = new Map<SupportedLocale, string>()
  if (!raw.trim()) {
    return map
  }
  for (const pair of raw.split(',')) {
    const idx = pair.indexOf(':')
    if (idx > 0) {
      const lang = pair.slice(0, idx).trim()
      const key = pair.slice(idx + 1).trim()
      if (lang && key) {
        const isKnown = I18N_CONFIG.supportedLocales.includes(
          lang as SupportedLocale
        )
        if (!isKnown) {
          throw new Error(
            `COMMERCETOOLS_STORE_KEYS contains unknown language "${lang}". ` +
              `Valid values: ${I18N_CONFIG.supportedLocales.join(', ')}`
          )
        }
        map.set(lang as SupportedLocale, key)
      }
    }
  }
  return map
}

let storeKeyMap: Map<SupportedLocale, string> | null = null

function getStoreKeyMap(): Map<SupportedLocale, string> {
  if (storeKeyMap) {
    return storeKeyMap
  }
  const map = parseStoreKeys(process.env.COMMERCETOOLS_STORE_KEYS ?? '')
  if (map.size > 0) {
    for (const lang of I18N_CONFIG.supportedLocales) {
      if (!map.has(lang)) {
        throw new Error(
          `COMMERCETOOLS_STORE_KEYS is missing an entry for language "${lang}". ` +
            `Expected format: en-US:us-store,de-DE:eu-store`
        )
      }
    }
  }
  storeKeyMap = map
  return storeKeyMap
}

export function getCtStoreKeyForLanguage(
  language: SupportedLocale | string
): string {
  const overrideKey = getStoreKeyMap().get(language as SupportedLocale)
  if (overrideKey) {
    return overrideKey
  }
  return getLocale(language).ctStoreKey
}
