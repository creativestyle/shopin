/**
 * 12 Teaser Regular. Fails if content type already exists.
 */
import type Migration from 'contentful-migration'
import type {
  ContentTypeDefinition,
  MigrationFunctionWithDefinition,
} from '../lib/content-type'
import { applyContentTypeFromDefinition } from '../lib/content-type'

const definition: ContentTypeDefinition = {
  id: 'teaserRegular',
  name: 'Teaser Regular',
  description: 'Regular teaser: image left, text right with CTA',
  displayField: 'headline',
  fields: [
    {
      id: 'image',
      spec: {
        type: 'Link',
        name: 'Image',
        linkType: 'Asset',
        localized: false,
      },
    },
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
      id: 'cta',
      spec: {
        type: 'Link',
        name: 'CTA (Button)',
        linkType: 'Entry',
        validations: [{ linkContentType: ['button'] }],
        localized: false,
      },
    },
  ],
}

const run: MigrationFunctionWithDefinition = async (migration: Migration) => {
  applyContentTypeFromDefinition(migration, definition)
}
export = run
