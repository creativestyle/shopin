/**
 * 05 Teaser Image. Fails if content type already exists.
 */
import type Migration from 'contentful-migration'
import type {
  ContentTypeDefinition,
  MigrationFunctionWithDefinition,
} from '../lib/content-type'
import { applyContentTypeFromDefinition } from '../lib/content-type'

const definition: ContentTypeDefinition = {
  id: 'teaserImage',
  name: 'Teaser Image',
  description: 'Single image with optional caption and link',
  displayField: 'title',
  fields: [
    { id: 'title', spec: { type: 'Symbol', name: 'Title', localized: true } },
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
