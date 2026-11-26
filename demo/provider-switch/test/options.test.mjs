/**
 * The /setup switcher rows (moved from the storefront's registry test with switcherOptions): every configured
 * category and provider with its label; a provider the selection rules out is disabled with the declared reason;
 * a category nobody can serve is unavailable with the reason.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import view_ from '../dist/view.js'

const { providerView, resolveProviders, switcherOptions } = view_
const part = () => ({ module: class {}, port: Symbol('p') })
const integ = (id, label, provides, requires) => ({
  id,
  label,
  provides,
  requires,
  parts: Object.fromEntries(provides.map((c) => [c, part])),
})
const [shop, local, index] = [
  integ('shop', 'Shop', ['commerce', 'search', 'auth'], {
    search: {
      needs: { commerce: 'shop' },
      reason: 'Shop search reads the shop catalog',
    },
    auth: {
      needs: { commerce: 'shop' },
      reason: 'Shop sign-in uses shop customers',
    },
  }),
  integ('local', 'Local data', ['commerce', 'cms']),
  integ('index', 'Index', ['search'], {
    search: {
      needs: { commerce: 'shop' },
      reason: {
        en: 'The index is fed from shop',
        de: 'Der Index wird aus shop befüllt',
      },
    },
  }),
]
const lists = {
  commerce: [shop, local],
  search: [shop, index],
  cms: [local],
  auth: [shop],
}
const view = providerView(lists)
const DEFAULT = resolveProviders(view, {}).providers
const ALT = resolveProviders(view, { commerce: 'local' }).providers

test('lists every configured category and provider with the label its integration declares', () => {
  const rows = switcherOptions(view, DEFAULT)
  assert.deepEqual(
    rows.map((r) => r.category),
    ['commerce', 'search', 'cms', 'auth']
  )
  for (const row of rows) {
    assert.deepEqual(
      row.options.map((o) => o.id),
      lists[row.category].map((i) => i.id)
    )
    for (const o of row.options) {
      assert.equal(
        o.label,
        [shop, local, index].find((i) => i.id === o.id).label
      )
    }
    assert.equal(row.switchable, row.options.length > 1)
    assert.equal(
      row.options.filter((o) => o.selected).length,
      row.unavailable ? 0 : 1
    )
  }
})

test('disables a provider whose requirement the selection does not meet, with the declared reason', () => {
  const search = switcherOptions(view, ALT).find((r) => r.category === 'search')
  assert.deepEqual(
    search.options.map((o) => o.disabledReason),
    ['Shop search reads the shop catalog', 'The index is fed from shop']
  )
  assert.ok(
    switcherOptions(view, DEFAULT).every((r) =>
      r.options.every((o) => !o.disabledReason)
    )
  )
})

test('switching commerce to the alternative leaves categories it rules out unavailable, with the reason', () => {
  const rows = switcherOptions(view, ALT)
  assert.deepEqual(
    rows.filter((r) => r.unavailable).map((r) => [r.category, r.unavailable]),
    [
      ['search', 'Shop search reads the shop catalog'],
      ['auth', 'Shop sign-in uses shop customers'],
    ]
  )
})

test("reasons an integration gives per language are shown in the page's language", () => {
  const search = switcherOptions(view, ALT, 'de-DE').find(
    (r) => r.category === 'search'
  )
  assert.deepEqual(
    search.options.map((o) => o.disabledReason),
    ['Shop search reads the shop catalog', 'Der Index wird aus shop befüllt']
  )
})
