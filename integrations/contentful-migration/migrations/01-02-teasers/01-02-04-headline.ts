/**
 * 04 Teaser Headline. Fails if content type already exists.
 */
import type Migration from 'contentful-migration'
import type {
  ContentTypeDefinition,
  MigrationFunctionWithDefinition,
} from '../lib/content-type'
import { applyContentTypeFromDefinition } from '../lib/content-type'

const definition: ContentTypeDefinition = {
  id: 'teaserHeadline',
  name: 'Teaser Headline',
  description: 'Heading with optional subtext and CTA',
  displayField: 'headline',
  fields: [
    {
      id: 'headline',
      spec: {
        type: 'Symbol',
        name: 'Headline',
        required: true,
        localized: true,
      },
    },
    { id: 'subtext', spec: { type: 'Text', name: 'Subtext', localized: true } },
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
