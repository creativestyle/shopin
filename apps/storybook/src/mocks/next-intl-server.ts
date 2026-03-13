import defaultMessages from '../../../../core/i18n/en-US.json'

// Create a nested object accessor function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

export async function getLocale(): Promise<string> {
  return 'en-US'
}

export async function getTranslations(namespace?: string) {
  return function t(key: string): string {
    const fullKey = namespace ? `${namespace}.${key}` : key
    const value = getNestedValue(defaultMessages, fullKey)

    if (value === undefined) {
      console.warn('Translation missing for key', fullKey)
      return fullKey // Return the key itself as fallback
    }

    return value
  }
}
