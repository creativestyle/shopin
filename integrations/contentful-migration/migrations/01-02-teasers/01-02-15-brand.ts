/**
 * 15 Teaser Brand. Fails if content type already exists.
 */
import type Migration from 'contentful-migration'
import type {
  ContentTypeDefinition,
  MigrationFunctionWithDefinition,
} from '../lib/content-type'
import { applyContentTypeFromDefinition } from '../lib/content-type'

const definition: ContentTypeDefinition = {
  id: 'teaserBrand',
  name: 'Teaser Brand',
  description: 'Scrollable row of brand items',
  displayField: 'title',
  fields: [
    { id: 'title', spec: { type: 'Symbol', name: 'Title', localized: true } },
    {
      id: 'brandItems',
      spec: {
        type: 'Array',
        name: 'Brand items',
        localized: false,
        required: true,
        items: {
          type: 'Link',
          linkType: 'Entry',
          validations: [{ linkContentType: ['teaserBrandItem'] }],
        },
      },
    },
  ],
}

const run: MigrationFunctionWithDefinition = async (migration: Migration) => {
  applyContentTypeFromDefinition(migration, definition)
}
export = run
