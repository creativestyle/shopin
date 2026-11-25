/**
 * Accordion item – one item (title + expanded + body). Referenced by Accordion.
 * Body is Rich Text so editors can use formatting, links, lists, etc.
 */
import type Migration from 'contentful-migration'
import type {
  MigrationFunctionWithDefinition,
  ContentTypeDefinition,
} from '../lib/content-type'
import { applyContentTypeFromDefinition } from '../lib/content-type'
import { RICH_TEXT_VALIDATIONS } from '../lib/rich-text-validations'

const definition: ContentTypeDefinition = {
  id: 'accordionItem',
  name: 'Accordion item',
  description:
    'Single accordion item: title, expanded flag and rich text body.',
  displayField: 'title',
  fields: [
    {
      id: 'title',
      spec: { type: 'Symbol', name: 'Title', required: true, localized: true },
    },
    {
      id: 'expanded',
      spec: {
        type: 'Boolean',
        name: 'Expanded',
        localized: false,
        defaultValue: { 'en-US': false, 'de-DE': false },
      },
    },
    {
      id: 'body',
      spec: {
        type: 'RichText',
        name: 'Body',
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
