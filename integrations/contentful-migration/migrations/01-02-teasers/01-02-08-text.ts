/**
 * 06 Teaser Text. Fails if content type already exists.
 */
import type Migration from 'contentful-migration'
import type {
  ContentTypeDefinition,
  MigrationFunctionWithDefinition,
} from '../lib/content-type'
import { applyContentTypeFromDefinition } from '../lib/content-type'

const definition: ContentTypeDefinition = {
  id: 'teaserText',
  name: 'Teaser Text',
  description: 'Plain text block',
  displayField: 'body',
  fields: [
    {
      id: 'body',
      spec: { type: 'Text', name: 'Body', required: true, localized: true },
    },
  ],
}

const run: MigrationFunctionWithDefinition = async (migration: Migration) => {
  applyContentTypeFromDefinition(migration, definition)
}
export = run
