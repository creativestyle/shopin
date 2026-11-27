/**
 * The mock CMS's preview request (the storefront's PreviewRequest slot): the usual preview URL
 * (`/api/draft?secret=…&slug=…&locale=…`). It only reads the parameters; the storefront compares the secret.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { previewRequest } from '../dist/preview.js'

test('reads the secret, the slug and the locale from the query', () => {
  assert.deepEqual(
    previewRequest(
      new URLSearchParams('secret=s3cret&slug=about&locale=de-DE')
    ),
    { secret: 's3cret', slug: 'about', locale: 'de-DE' }
  )
})

test('a missing parameter is null, for the storefront to refuse', () => {
  for (const missing of ['secret', 'slug', 'locale']) {
    const query = new URLSearchParams('secret=s3cret&slug=about&locale=de-DE')
    query.delete(missing)
    const read = previewRequest(query)
    assert.equal(read[missing], null, missing)
    for (const other of ['secret', 'slug', 'locale'].filter(
      (k) => k !== missing
    )) {
      assert.notEqual(read[other], null, `${other} without ${missing}`)
    }
  }
})
