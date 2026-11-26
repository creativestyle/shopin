// Every data source the demo offers has a name and a description in each storefront language
// (shopin's apps/presentation/__tests__/data-source-translations.test.ts, moved here with the data sources).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { DATA_SOURCES } from '../dist/sets.js'

const require = createRequire(import.meta.url)
const locales = {
  'en-US': require('@core/i18n/en-US.json'),
  'de-DE': require('@core/i18n/de-DE.json'),
}

for (const [locale, messages] of Object.entries(locales)) {
  for (const source of Object.keys(DATA_SOURCES)) {
    test(`${locale}: has name and description for ${source}`, () => {
      const entry = messages.dataSourceSelector.sources[source]
      assert.equal(typeof entry?.name, 'string')
      assert.notEqual(entry.name, '')
      assert.equal(typeof entry?.description, 'string')
      assert.notEqual(entry.description, '')
    })
  }
}
