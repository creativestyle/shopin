/**
 * Teaser Accordion – teaser that references one accordion entry.
 */
import type Migration from 'contentful-migration'
import type {
  ContentTypeDefinition,
  MigrationFunctionWithDefinition,
} from '../lib/content-type'
import { applyContentTypeFromDefinition } from '../lib/content-type'

const definition: ContentTypeDefinition = {
  id: 'teaserAccordion',
  name: 'Teaser Accordion',
  description: 'Accordion block: links to one accordion entry',
  displayField: 'title',
  fields: [
    { id: 'title', spec: { type: 'Symbol', name: 'Title', localized: true } },
    {
      id: 'accordion',
      spec: {
        type: 'Link',
        name: 'Accordion',
        linkType: 'Entry',
        validations: [{ linkContentType: ['accordion'] }],
        localized: false,
      },
    },
  ],
}

const run: MigrationFunctionWithDefinition = async (migration: Migration) => {
  applyContentTypeFromDefinition(migration, definition)
}
export = run
