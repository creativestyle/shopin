/**
 * Button – reusable CTA: link + variant + style (presentation only on Button).
 * Used in components as cta and as standalone page component.
 */
import type Migration from 'contentful-migration'
import type {
  MigrationFunctionWithDefinition,
  ContentTypeDefinition,
} from '../lib/content-type'
import { applyContentTypeFromDefinition } from '../lib/content-type'

const definition: ContentTypeDefinition = {
  id: 'button',
  name: 'Button',
  description:
    'Reusable CTA: link entry (label + url) + variant + style. Variant/style only here.',
  displayField: 'name',
  fields: [
    {
      id: 'name',
      spec: {
        type: 'Symbol',
        name: 'Internal name',
        localized: false,
      },
    },
    {
      id: 'link',
      spec: {
        type: 'Link',
        name: 'Link',
        linkType: 'Entry',
        required: true,
        validations: [{ linkContentType: ['link'] }],
        localized: false,
      },
    },
    {
      id: 'variant',
      spec: {
        type: 'Symbol',
        name: 'Variant',
        validations: [{ in: ['primary', 'secondary', 'tertiary'] }],
        localized: false,
      },
    },
    {
      id: 'style',
      spec: {
        type: 'Symbol',
        name: 'Style',
        validations: [{ in: ['red', 'white', 'black'] }],
        localized: false,
      },
    },
  ],
}

const run: MigrationFunctionWithDefinition = async (migration: Migration) => {
  applyContentTypeFromDefinition(migration, definition)
}
export = run
