/**
 * Moves canonicalUrl next to the other SEO fields.
 * New fields are appended last, which put it below the long components list.
 * Separate from 03-01-01 because that one has already run: re-running its createField would fail.
 */
import type Migration from 'contentful-migration'

async function run(migration: Migration) {
  migration
    .editContentType('page')
    .moveField('canonicalUrl')
    .afterField('noIndex')
}

export = run
