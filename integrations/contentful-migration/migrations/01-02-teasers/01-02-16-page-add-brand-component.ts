/**
 * 16 Update page.components validation to include teaserBrand.
 * Must run after 01-02-15-brand.ts (teaserBrand content type must exist first).
 */
import type Migration from 'contentful-migration'
import { PAGE_COMPONENT_IDS } from '../lib/content-types/ids'

const run = async (migration: Migration) => {
  const page = migration.editContentType('page')
  page.editField('components').items({
    type: 'Link',
    linkType: 'Entry',
    validations: [{ linkContentType: [...PAGE_COMPONENT_IDS] }],
  })
}

export = run
