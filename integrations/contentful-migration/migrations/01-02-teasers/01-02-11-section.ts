/**
 * 11 Teaser Section. Fails if content type already exists.
 */
import type Migration from 'contentful-migration'
import type {
  ContentTypeDefinition,
  MigrationFunctionWithDefinition,
} from '../lib/content-type'
import { applyContentTypeFromDefinition } from '../lib/content-type'

const definition: ContentTypeDefinition = {
  id: 'teaserSection',
  name: 'Teaser Section',
  description:
    'Section: category label, headline, body, subcategory links and image',
  displayField: 'headline',
  fields: [
    {
      id: 'categoryLabel',
      spec: { type: 'Symbol', name: 'Category label', localized: true },
    },
    {
      id: 'headline',
      spec: { type: 'Symbol', name: 'Headline', localized: true },
    },
    { id: 'body', spec: { type: 'Text', name: 'Body', localized: true } },
    {
      id: 'subcategoryLinkEntries',
      spec: {
        type: 'Array',
        name: 'Subcategory links',
        localized: false,
        items: {
          type: 'Link',
          linkType: 'Entry',
          validations: [{ linkContentType: ['link'] }],
        },
      },
    },
    {
      id: 'image',
      spec: {
        type: 'Link',
        name: 'Image',
        linkType: 'Asset',
        localized: false,
      },
    },
  ],
}

const run: MigrationFunctionWithDefinition = async (migration: Migration) => {
  applyContentTypeFromDefinition(migration, definition)
}
export = run
