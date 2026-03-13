/**
 * 03 Teaser Hero. Fails if content type already exists.
 */
import type Migration from 'contentful-migration'
import type {
  ContentTypeDefinition,
  MigrationFunctionWithDefinition,
} from '../lib/content-type'
import { applyContentTypeFromDefinition } from '../lib/content-type'

const definition: ContentTypeDefinition = {
  id: 'teaserHero',
  name: 'Teaser Hero',
  description: 'Full-width hero: background image, headline, body, CTA',
  displayField: 'headline',
  fields: [
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
    {
      id: 'backgroundImage',
      spec: {
        type: 'Link',
        name: 'Background image',
        linkType: 'Asset',
        localized: false,
      },
    },
  ],
}

const run: MigrationFunctionWithDefinition = async (migration: Migration) => {
  applyContentTypeFromDefinition(migration, definition)
}
export = run
