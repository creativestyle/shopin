/** The shop's store key per locale (`commercetools({ storeKeys })` in shopin.config.ts). */
export type StoreKeys = Readonly<Record<string, string>>

function parseStoreKeys(raw: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const pair of raw.split(',')) {
    const idx = pair.indexOf(':')
    const lang = pair.slice(0, idx).trim()
    const key = pair.slice(idx + 1).trim()
    if (idx > 0 && lang && key) {
      map.set(lang, key)
    }
  }
  return map
}

/**
 * The store key per locale of one commerce port instance, resolved at its boot (`storeKeysFor`). Each instance has
 * its own: nothing is kept at module level, so two instances (another config, a test) never see each other's keys.
 */
export class StoreKeyMap {
  constructor(
    private readonly keys: ReadonlyMap<string, string>,
    private readonly defaultLocale: string | undefined
  ) {}

  /** Every configured store, once each (two locales may share a store). */
  stores(): string[] {
    return [...new Set(this.keys.values())]
  }

  /** The store of a locale; a locale the shop does not list gets the first locale's store. */
  forLanguage(language: string): string {
    const key =
      this.keys.get(language) ??
      (this.defaultLocale === undefined
        ? undefined
        : this.keys.get(this.defaultLocale))
    if (!key) {
      throw new Error(`commercetools: no store key for ${language}`)
    }
    return key
  }
}

/**
 * The store key per locale: the factory option `storeKeys` (shopin.config.ts) first; COMMERCETOOLS_STORE_KEYS
 * (`en-US:us-store,de-DE:eu-store`) only for a locale the option leaves out. Throws, naming the fix, when a key names a
 * locale the shop does not have (config/locales.json) or a locale has no store key. The commerce port resolves it at
 * boot.
 */
export function storeKeysFor(
  env: string | undefined,
  storeKeys: StoreKeys = {},
  locales: readonly string[]
): StoreKeyMap {
  const map = new Map<string, string>(
    Object.entries(storeKeys).filter(
      (e): e is [string, string] => typeof e[1] === 'string'
    )
  )
  for (const [lang, key] of parseStoreKeys(env ?? '')) {
    if (!map.has(lang)) {
      map.set(lang, key)
    }
  }
  const unknown = [...map.keys()].filter((lang) => !locales.includes(lang))
  const missing = locales.filter((l) => !map.has(l))
  const problems = [
    ...(unknown.length
      ? [
          `store keys for ${unknown.join(', ')}, which config/locales.json does not list (${locales.join(', ')})`,
        ]
      : []),
    ...(missing.length
      ? [
          `no store key for ${missing.join(', ')}: add it to commercetools({ storeKeys: { "${missing[0]}": "<store key>" } }) in shopin.config.ts, or to COMMERCETOOLS_STORE_KEYS`,
        ]
      : []),
  ]
  if (problems.length) {
    throw new Error(`commercetools: ${problems.join('; ')}`)
  }
  return new StoreKeyMap(map, locales[0])
}
