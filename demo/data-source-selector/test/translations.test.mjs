// The /setup page's own texts exist in each storefront language: its headings per category the kit knows (the
// providers' names and descriptions come from their descriptors, not from these texts).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
// the kit's categories (not exported by the package: read from the repository)
const categories = require('../../../core/integration-kit/src/categories.json')
const locales = {
  'en-US': require('@core/i18n/en-US.json'),
  'de-DE': require('@core/i18n/de-DE.json'),
}

for (const [locale, messages] of Object.entries(locales)) {
  test(`${locale}: has the /setup texts and a heading for every category`, () => {
    const t = messages.dataSourceSelector
    for (const key of ['title', 'intro', 'select', 'selected', 'unavailable']) {
      assert.ok(typeof t[key] === 'string' && t[key] !== '', key)
    }
    for (const category of categories) {
      assert.ok(
        typeof t.categories?.[category] === 'string' &&
          t.categories[category] !== '',
        category
      )
    }
    // no hand-written list of data sources: the descriptors name the providers
    assert.equal(t.sources, undefined)
  })
}
