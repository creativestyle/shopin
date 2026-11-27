/**
 * The mock CMS's preview request (the storefront's PreviewRequest slot): the usual preview URL
 * (`/api/draft?secret=…&slug=…&locale=…`); the secret is compared by the storefront, never here.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { previewRequest } from '../dist/preview.js'

test('the page to preview when the secret matches; a missing slug or locale stays null for the storefront to refuse', () => {
  const seen = []
  const matches = (value) => {
    seen.push(value)
    return value === 's3cret'
  }
  assert.deepEqual(
    previewRequest(
      new URLSearchParams('secret=s3cret&slug=about&locale=de-DE'),
      matches
    ),
    { slug: 'about', locale: 'de-DE' }
  )
  assert.deepEqual(
    previewRequest(new URLSearchParams('secret=s3cret&slug=about'), matches),
    {
      slug: 'about',
      locale: null,
    }
  )
  assert.deepEqual(seen, ['s3cret', 's3cret'])
})

test('no page without the secret', () => {
  const matches = (value) => value === 's3cret'
  assert.equal(
    previewRequest(
      new URLSearchParams('secret=wrong&slug=about&locale=en-US'),
      matches
    ),
    undefined
  )
  assert.equal(
    previewRequest(new URLSearchParams('slug=about&locale=en-US'), matches),
    undefined
  )
})
