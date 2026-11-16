import enUS from '../../../../core/i18n/en-US.json'
import deDE from '../../../../core/i18n/de-DE.json'

const LOCALES = {
  'en-US': { messages: enUS, pathPrefix: '' },
  'de-DE': { messages: deDE, pathPrefix: '/de' },
}

export type Locale = keyof typeof LOCALES

function resolveLocale(value = 'en-US'): Locale {
  if (!(value in LOCALES)) {
    throw new Error(
      `E2E_LOCALE must be one of ${Object.keys(LOCALES).join(', ')}`
    )
  }
  return value as Locale
}

export const LOCALE = resolveLocale(process.env.E2E_LOCALE)

type Values = Record<string, string | number>

function message(key: string): string {
  const value = key
    .split('.')
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown> | undefined)?.[part],
      LOCALES[LOCALE].messages
    )
  if (typeof value !== 'string') {
    throw new Error(`Missing translation "${key}" in ${LOCALE}`)
  }
  if (/\{\s*\w+\s*,/.test(value)) {
    throw new Error(`ICU message "${key}" is not supported by t()`)
  }
  return value
}

/** Translated text for a key in core/i18n, as the app renders it. */
export function t(key: string, values: Values = {}): string {
  return message(key).replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match
  )
}

export const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Pattern for a translated text; placeholders without a value match any text. */
export function tPattern(key: string, values: Values = {}): RegExp {
  const source = message(key)
    .split(/(\{\w+\})/)
    .map((part) => {
      const name = /^\{(\w+)\}$/.exec(part)?.[1]
      if (!name) return escapeRegExp(part)
      return name in values ? escapeRegExp(String(values[name])) : '.+'
    })
    .join('')
  return new RegExp(`^${source}$`)
}

/** Locale-prefixed path, e.g. /cart → /de/cart. */
export function localePath(path: string): string {
  const prefix = LOCALES[LOCALE].pathPrefix
  return path === '/' ? prefix || '/' : `${prefix}${path}`
}

export function countryName(code: string): string {
  return new Intl.DisplayNames([LOCALE], { type: 'region' }).of(code)!
}
