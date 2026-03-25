/**
 * 14 Teaser Brand Item.
 * Fails if content type already exists.
 */
import type Migration from 'contentful-migration'
import type {
  ContentTypeDefinition,
  MigrationFunctionWithDefinition,
} from '../lib/content-type'
import { applyContentTypeFromDefinition } from '../lib/content-type'

const definition: ContentTypeDefinition = {
  id: 'teaserBrandItem',
  name: 'Teaser Brand Item',
  description: 'Single item in a brand teaser',
  displayField: 'caption',
  fields: [
    {
      id: 'image',
      spec: {
        type: 'Link',
        name: 'Image',
        linkType: 'Asset',
        required: true,
        localized: false,
      },
    },
    {
      id: 'caption',
      spec: { type: 'Symbol', name: 'Caption', localized: true },
    },
    {
      id: 'link',
      spec: {
        type: 'Link',
        name: 'Link',
        linkType: 'Entry',
        validations: [{ linkContentType: ['link'] }],
        localized: false,
      },
    },
  ],
}

const run: MigrationFunctionWithDefinition = async (migration: Migration) => {
  applyContentTypeFromDefinition(migration, definition)
}
export = run
