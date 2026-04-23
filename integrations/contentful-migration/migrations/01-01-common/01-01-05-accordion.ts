/**
 * Accordion – page component (title + mode + items linking to accordionItem).
 */
import type Migration from 'contentful-migration'
import type {
  MigrationFunctionWithDefinition,
  ContentTypeDefinition,
} from '../lib/content-type'
import { applyContentTypeFromDefinition } from '../lib/content-type'

const definition: ContentTypeDefinition = {
  id: 'accordion',
  name: 'Accordion',
  description:
    'Accordion page component: optional title, mode and accordion items.',
  displayField: 'title',
  fields: [
    { id: 'title', spec: { type: 'Symbol', name: 'Title', localized: true } },
    {
      id: 'mode',
      spec: {
        type: 'Symbol',
        name: 'Mode',
        localized: false,
        validations: [{ in: ['single', 'multiple'] }],
      },
    },
    {
      id: 'items',
      spec: {
        type: 'Array',
        name: 'Items',
        localized: false,
        items: {
          type: 'Link',
          linkType: 'Entry',
          validations: [{ linkContentType: ['accordionItem'] }],
        },
      },
    },
  ],
}

const run: MigrationFunctionWithDefinition = async (migration: Migration) => {
  applyContentTypeFromDefinition(migration, definition)
  migration
    .editContentType('accordion')
    .changeFieldControl('mode', 'builtin', 'radio')
}
export = run
