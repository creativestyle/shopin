/**
 * Adds canonicalUrl (SEO) to the Page content type.
 * Group 03 so it sorts last: `migrate --from 30101` applies only this migration on a space
 * that already has the content model, without re-running content types or demo seeds.
 * Non-destructive — adding an optional field leaves existing entries untouched.
 */
import type Migration from 'contentful-migration'

async function run(migration: Migration) {
  const page = migration.editContentType('page')

  page
    .createField('canonicalUrl')
    .name('Canonical URL (SEO)')
    .type('Symbol')
    .required(false)
    // Localized: each locale has its own URL, so each needs its own canonical.
    .localized(true)
    // Reject relative paths — a relative value would render a broken canonical tag.
    .validations([{ regexp: { pattern: '^https?://' } }])

  page.changeFieldControl('canonicalUrl', 'builtin', 'singleLine', {
    helpText: "Absolute URL. Leave empty to use this page's own URL.",
  })
}

export = run
