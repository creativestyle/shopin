/**
 * 09 Teaser Slider. Fails if content type already exists.
 */
import type Migration from 'contentful-migration'
import type {
  ContentTypeDefinition,
  MigrationFunctionWithDefinition,
} from '../lib/content-type'
import { applyContentTypeFromDefinition } from '../lib/content-type'

const definition: ContentTypeDefinition = {
  id: 'teaserSlider',
  name: 'Teaser Slider',
  description: 'Slide-based slider',
  displayField: 'title',
  fields: [
    { id: 'title', spec: { type: 'Symbol', name: 'Title', localized: true } },
    {
      id: 'slides',
      spec: {
        type: 'Array',
        name: 'Slides',
        localized: false,
        items: {
          type: 'Link',
          linkType: 'Entry',
          validations: [{ linkContentType: ['teaserCarouselItem'] }],
        },
      },
    },
  ],
}

const run: MigrationFunctionWithDefinition = async (migration: Migration) => {
  applyContentTypeFromDefinition(migration, definition)
}
export = run
