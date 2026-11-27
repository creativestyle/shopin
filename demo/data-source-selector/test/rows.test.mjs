/**
 * /setup lists per category the integrations the switch has, each by the name (`label`) and description its
 * descriptor declares, never from a hand-written list or a split label; a provider the selection rules out is disabled with its reason.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import view_ from '@demo/provider-switch/view'
import { setupRows } from '../dist/rows.js'

const { providerView, COMMERCE_SEARCH } = view_
const integ = (id, label, description, requires) => ({
  id,
  label,
  ...(description ? { description } : {}),
  ...(requires ? { requires } : {}),
})
const platform = integ(
  'fx-platform',
  { en: 'Fixture platform', de: 'Fixture-Plattform' },
  {
    en: 'catalog and carts of the project',
    de: 'Katalog und Warenkörbe des Projekts',
  }
)
// a name with a colon stays whole: the description is its own field, not the text after ': '
const sample = integ('fx-sample', 'Sample: data', 'generated, no account')
const index = integ('fx-index', 'Fixture index', 'results from the index', {
  search: {
    needs: { commerce: 'fx-platform' },
    reason: {
      en: 'The index is fed from the platform',
      de: 'Der Index wird aus der Plattform befüllt',
    },
  },
})
const view = providerView({
  commerce: [platform, sample],
  search: [COMMERCE_SEARCH, index],
})

test('a row per switched category, an option per integration, named by its descriptor label', () => {
  const rows = setupRows(view, { commerce: 'fx-platform', search: 'fx-index' })
  assert.deepEqual(
    rows.map((r) => [r.category, r.cookie]),
    [
      ['commerce', 'shopin-commerce'],
      ['search', 'shopin-search'],
    ]
  )
  assert.deepEqual(rows[0].options, [
    {
      id: 'fx-platform',
      name: 'Fixture platform',
      description: 'catalog and carts of the project',
      selected: true,
    },
    {
      id: 'fx-sample',
      name: 'Sample: data',
      description: 'generated, no account',
      selected: false,
    },
  ])
  assert.deepEqual(
    rows[1].options.map((o) => [o.id, o.name, o.selected]),
    [
      ['commerce', "The commerce platform's own product search", false],
      ['fx-index', 'Fixture index', true],
    ]
  )
})

test("the descriptor's text in the page's language", () => {
  const rows = setupRows(view, { commerce: 'fx-platform' }, 'de-DE')
  assert.equal(rows[0].options[0].name, 'Fixture-Plattform')
  assert.equal(
    rows[0].options[0].description,
    'Katalog und Warenkörbe des Projekts'
  )
})

test('a pairing that does not work together is disabled with the reason its descriptor declares', () => {
  const rows = setupRows(view, { commerce: 'fx-sample', search: 'fx-index' })
  const search = rows.find((r) => r.category === 'search')
  assert.equal(search.options.find((o) => o.id === 'commerce').selected, true)
  const disabled = search.options.find((o) => o.id === 'fx-index')
  assert.deepEqual(disabled.disabledReason, {
    text: 'The index is fed from the platform',
  })
  assert.equal(disabled.selected, false)
  assert.deepEqual(
    setupRows(view, { commerce: 'fx-sample' }, 'de').find(
      (r) => r.category === 'search'
    ).options[1].disabledReason,
    { text: 'Der Index wird aus der Plattform befüllt' }
  )
})

test('a descriptor without a description shows its name only; one without a label, its id', () => {
  const rows = setupRows(
    providerView({
      cms: [integ('fx-plain', 'Plain CMS'), { id: 'fx-bare', ports: {} }],
    }),
    {}
  )
  assert.deepEqual(
    rows[0].options.map((o) => [o.name, o.description]),
    [
      ['Plain CMS', ''],
      ['fx-bare', ''],
    ]
  )
})
