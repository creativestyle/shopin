/**
 * 01 Teaser Carousel Item.
 * Fails if content type already exists.
 */
import type Migration from 'contentful-migration'
import type {
  ContentTypeDefinition,
  MigrationFunctionWithDefinition,
} from '../lib/content-type'
import { applyContentTypeFromDefinition } from '../lib/content-type'

const definition: ContentTypeDefinition = {
  id: 'teaserCarouselItem',
  name: 'Teaser Carousel Item',
  description: 'Single item in a carousel or slider teaser',
  displayField: 'caption',
  fields: [
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
    {
      id: 'headline',
      spec: { type: 'Symbol', name: 'Headline', localized: true },
    },
    { id: 'body', spec: { type: 'Text', name: 'Body', localized: true } },
    {
      id: 'cta',
      spec: {
        type: 'Link',
        name: 'CTA (Button)',
        linkType: 'Entry',
        validations: [{ linkContentType: ['button'] }],
        localized: false,
      },
    },
  ],
}

const run: MigrationFunctionWithDefinition = async (migration: Migration) => {
  applyContentTypeFromDefinition(migration, definition)
}
export = run
