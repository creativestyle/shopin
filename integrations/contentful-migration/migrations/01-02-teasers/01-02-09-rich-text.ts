/**
 * 07 Teaser Rich Text. Fails if content type already exists.
 */
import type Migration from 'contentful-migration'
import type {
  ContentTypeDefinition,
  MigrationFunctionWithDefinition,
} from '../lib/content-type'
import { applyContentTypeFromDefinition } from '../lib/content-type'
import { RICH_TEXT_VALIDATIONS } from '../lib/rich-text-validations'

const definition: ContentTypeDefinition = {
  id: 'teaserRichText',
  name: 'Teaser Rich Text',
  description: 'Formatted rich text',
  displayField: 'title',
  fields: [
    {
      id: 'title',
      spec: { type: 'Symbol', name: 'Title', required: false, localized: true },
    },
    {
      id: 'richText',
      spec: {
        type: 'RichText',
        name: 'Rich text',
        required: true,
        localized: true,
        validations: RICH_TEXT_VALIDATIONS,
      },
    },
  ],
}

const run: MigrationFunctionWithDefinition = async (migration: Migration) => {
  applyContentTypeFromDefinition(migration, definition)
}
export = run
