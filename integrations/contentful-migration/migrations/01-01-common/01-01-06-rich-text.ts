/**
 * Generic Rich text – reusable content type for page components and embeddable blocks.
 * Can be used as a page component or referenced from other types (e.g. accordion item body).
 */
import type Migration from 'contentful-migration'
import type {
  ContentTypeDefinition,
  MigrationFunctionWithDefinition,
} from '../lib/content-type'
import { applyContentTypeFromDefinition } from '../lib/content-type'
import { RICH_TEXT_VALIDATIONS } from '../lib/rich-text-validations'

const definition: ContentTypeDefinition = {
  id: 'richText',
  name: 'Rich text',
  description:
    'Reusable rich text block (page component or embeddable in other content types)',
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
