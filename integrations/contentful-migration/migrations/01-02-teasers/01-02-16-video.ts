/**
 * 05 Teaser Video. Fails if content type already exists.
 */
import type Migration from 'contentful-migration'
import type {
  ContentTypeDefinition,
  MigrationFunctionWithDefinition,
} from '../lib/content-type'
import { applyContentTypeFromDefinition } from '../lib/content-type'

const definition: ContentTypeDefinition = {
  id: 'teaserVideo',
  name: 'Teaser Video',
  description: 'Single video with optional caption and link',
  displayField: 'title',
  fields: [
    { id: 'title', spec: { type: 'Symbol', name: 'Title', localized: true } },
    {
      id: 'video',
      spec: {
        type: 'Link',
        name: 'Video',
        linkType: 'Asset',
        localized: false,
        required: true,
      },
    },
    {
      id: 'thumbnail',
      spec: {
        type: 'Link',
        name: 'Thumbnail',
        linkType: 'Asset',
        localized: false,
      },
    },
    {
      id: 'autoplay',
      spec: { type: 'Boolean', name: 'Autoplay', localized: false },
    },
    {
      id: 'controls',
      spec: { type: 'Boolean', name: 'Controls', localized: false },
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
