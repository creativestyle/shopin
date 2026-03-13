/**
 * 08 Teaser Carousel. Fails if content type already exists.
 */
import type Migration from 'contentful-migration'
import type {
  ContentTypeDefinition,
  MigrationFunctionWithDefinition,
} from '../lib/content-type'
import { applyContentTypeFromDefinition } from '../lib/content-type'

const definition: ContentTypeDefinition = {
  id: 'teaserCarousel',
  name: 'Teaser Carousel',
  description: 'Scrollable row of items',
  displayField: 'title',
  fields: [
    { id: 'title', spec: { type: 'Symbol', name: 'Title', localized: true } },
    {
      id: 'carouselItems',
      spec: {
        type: 'Array',
        name: 'Carousel items',
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
