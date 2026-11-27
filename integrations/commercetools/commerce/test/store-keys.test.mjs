/**
 * Store keys are the integration's option (`commercetools({ storeKeys })`), not part of a locale: every locale of
 * config/locales.json needs one, COMMERCETOOLS_STORE_KEYS fills only a locale the option leaves out, and the boot
 * names the fix.
 * Each port instance resolves its own (`storeKeysFor`), so two instances never share them.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import stores from '../dist/config/stores.js'

const { storeKeysFor } = stores

/** The shop's locales as the BFF hands them to the port (`RequestContext.locales`). */
const LOCALES = ['en-US', 'de-DE', 'fr-FR']
const [first, ...rest] = LOCALES
const all = Object.fromEntries(LOCALES.map((l) => [l, `store-${l}`]))
const keysFor = (env, keys) => storeKeysFor(env, keys, LOCALES)

describe('commercetools store keys', () => {
  it('reads the store of each locale from the option', () => {
    const stores = keysFor(undefined, all)
    for (const l of LOCALES) {
      assert.equal(stores.forLanguage(l), `store-${l}`)
    }
  })

  it('the option wins over COMMERCETOOLS_STORE_KEYS for a locale it names', () => {
    assert.equal(
      keysFor(`${first}:from-env`, all).forLanguage(first),
      `store-${first}`
    )
  })

  it('COMMERCETOOLS_STORE_KEYS gives the store of a locale the option leaves out', () => {
    const partial = { [first]: 'only-one' }
    const env = rest.map((l) => `${l}:env-${l}`).join(',')
    const stores = keysFor(env, partial)
    assert.equal(stores.forLanguage(first), 'only-one')
    for (const l of rest) {
      assert.equal(stores.forLanguage(l), `env-${l}`)
    }
  })

  it('a locale without a store stops the boot and names the option to set', () => {
    const partial = { [first]: 'only-one' }
    assert.throws(() => keysFor(undefined, partial), {
      message: new RegExp(
        `no store key for ${rest.join(', ')}: add it to commercetools`
      ),
    })
  })

  it('the default store is the first locale’s', () => {
    assert.equal(keysFor(undefined, all).forLanguage('it-IT'), `store-${first}`)
  })

  it('a store for a locale the shop does not have is refused', () => {
    assert.throws(() => keysFor(undefined, { ...all, 'xx-XX': 's' }), {
      message: /store keys for xx-XX, which config\/locales.json does not list/,
    })
  })

  it('two instances keep their own store keys (nothing is kept at module level)', () => {
    const a = keysFor(undefined, all)
    const b = keysFor(
      undefined,
      Object.fromEntries(LOCALES.map((l) => [l, `other-${l}`]))
    )
    assert.equal(a.forLanguage(first), `store-${first}`)
    assert.equal(b.forLanguage(first), `other-${first}`)
  })
})
