/**
 * Why a category is not available, on /setup in the page's language: the switch's fixed codes (`not configured`,
 * `credentials check failed`) are translated (`dataSourceSelector.reasons.*`, the provider's name as a value), never
 * shown as the English code; a requirement's reason comes in the page's language from its descriptor.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createTranslator } from 'next-intl'
import view_ from '@demo/provider-switch/view'
import { setupRows } from '../dist/rows.js'
import { DataSourceSelector } from '../dist/components/data-source-selector.js'
import { selectorLabels } from '../dist/components/labels.js'

const require = createRequire(import.meta.url)
const { providerView, COMMERCE_SEARCH } = view_
const messages = {
  'en-US': require('@core/i18n/en-US.json'),
  'de-DE': require('@core/i18n/de-DE.json'),
}

// commerce: the platform failed its credentials check (no requirement of its own), the sample serves
const platform = {
  id: 'fx-platform',
  label: { en: 'Fixture platform', de: 'Fixture-Plattform' },
}
const sample = { id: 'fx-sample', label: 'Fixture sample' }
// cms: its only provider lacks its variables (no requirement either)
const cms = { id: 'fx-cms', label: 'Fixture CMS' }
// each needs the platform: ruled out by the pairing too, but its own unavailability is the reason shown
const needsPlatform = (category, id, label) => ({
  id,
  label,
  requires: {
    [category]: {
      needs: { commerce: 'fx-platform' },
      reason: { en: 'Needs the platform', de: 'Braucht die Plattform' },
    },
  },
})
const auth = needsPlatform('auth', 'fx-auth', {
  en: 'Fixture sign-in',
  de: 'Fixture-Anmeldung',
})
// search: the index is available, only the pairing rules it out
const index = needsPlatform('search', 'fx-index', 'Fixture index')
const CODES = {
  'fx-platform': 'credentials check failed',
  'fx-cms': 'not configured',
  'fx-auth': 'credentials check failed',
}
/** The switch's view with the BFF's boot codes on the providers (as `viewNow` marks them). */
const view = providerView({
  commerce: [platform, sample],
  cms: [cms],
  auth: [auth],
  search: [COMMERCE_SEARCH, index],
}).map((c) => ({
  ...c,
  options: c.options.map((o) =>
    CODES[o.id] ? { ...o, unavailable: CODES[o.id] } : o
  ),
}))

/** The /setup panel's text in a locale: rows, labels from the storefront texts, the selector's markup. */
function page(locale) {
  const t = createTranslator({
    locale,
    messages: messages[locale],
    namespace: 'dataSourceSelector',
  })
  const markup = renderToStaticMarkup(
    createElement(DataSourceSelector, {
      labels: selectorLabels(t),
      rows: setupRows(view, {}, locale),
      onSelect: () => {},
    })
  )
  return markup.replace(/<[^>]+>/g, '\n')
}

const option = (rows, category, id) =>
  rows.find((r) => r.category === category).options.find((o) => o.id === id)

test('the rows build with providers that cannot serve, and carry the code and the provider', () => {
  const rows = setupRows(view, {}, 'de-DE')
  assert.deepEqual(
    rows.map((r) => [r.category, r.unavailable]),
    [
      ['commerce', undefined],
      ['cms', { code: 'notConfigured', provider: 'Fixture CMS' }],
      ['auth', { code: 'checkFailed', provider: 'Fixture-Anmeldung' }],
      ['search', undefined],
    ]
  )
  // a provider that cannot serve is disabled with its own reason, a requirement or not
  assert.deepEqual(option(rows, 'commerce', 'fx-platform').disabledReason, {
    code: 'checkFailed',
    provider: 'Fixture-Plattform',
  })
  assert.deepEqual(option(rows, 'cms', 'fx-cms').disabledReason, {
    code: 'notConfigured',
    provider: 'Fixture CMS',
  })
  assert.deepEqual(option(rows, 'auth', 'fx-auth').disabledReason, {
    code: 'checkFailed',
    provider: 'Fixture-Anmeldung',
  })
  assert.equal(option(rows, 'commerce', 'fx-sample').selected, true)
  // one the pairing rules out keeps its requirement's reason
  assert.deepEqual(option(rows, 'search', 'fx-index').disabledReason, {
    text: 'Braucht die Plattform',
  })
})

test('German /setup: the reasons in German', () => {
  const text = page('de-DE')
  for (const line of [
    'Derzeit nicht verfügbar: Fixture CMS: nicht konfiguriert',
    'Derzeit nicht verfügbar: Fixture-Anmeldung: Prüfung der Zugangsdaten fehlgeschlagen',
    // the options' own reasons
    '\nFixture-Plattform: Prüfung der Zugangsdaten fehlgeschlagen\n',
    '\nFixture CMS: nicht konfiguriert\n',
    '\nFixture-Anmeldung: Prüfung der Zugangsdaten fehlgeschlagen\n',
    '\nBraucht die Plattform\n',
  ]) {
    assert.ok(text.includes(line), line)
  }
  assert.doesNotMatch(text, /not configured|credentials check failed/)
})

test('English /setup: the same reasons in English', () => {
  const text = page('en-US')
  for (const line of [
    'Not available now: Fixture CMS: not configured',
    'Not available now: Fixture sign-in: credentials check failed',
    '\nFixture platform: credentials check failed\n',
    '\nFixture CMS: not configured\n',
    '\nNeeds the platform\n',
  ]) {
    assert.ok(text.includes(line), line)
  }
})
