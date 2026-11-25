/**
 * Link – common content type: either a CMS page reference or an external/custom URL.
 * Link data only; no variant/style – those live on Button/CTA.
 * Use "Linked page" to point to a Contentful page (locale-aware URLs), or "URL" for external/custom links.
 * Fails if content type already exists (run once per environment). Page content type must exist (01-01-01).
 */
import type Migration from 'contentful-migration'
import type {
  MigrationFunctionWithDefinition,
  ContentTypeDefinition,
} from '../lib/content-type'
import { applyContentTypeFromDefinition } from '../lib/content-type'

const definition: ContentTypeDefinition = {
  id: 'link',
  name: 'Link',
  description:
    'Either link to a CMS page (Linked page) for locale-aware URLs, or enter a URL for external/custom links. When using Linked page, also fill URL (e.g. default-locale path like /about) for fallback and lookup. Use target="_blank" for new tab.',
  displayField: 'label',
  fields: [
    {
      id: 'label',
      spec: { type: 'Symbol', name: 'Label', required: true, localized: true },
    },
    {
      id: 'url',
      spec: { type: 'Symbol', name: 'URL', required: false, localized: true },
    },
    {
      id: 'linkedPage',
      spec: {
        type: 'Link',
        name: 'Linked page',
        linkType: 'Entry',
        validations: [{ linkContentType: ['page'] }],
        localized: false,
      },
    },
    {
      id: 'ariaLabel',
      spec: { type: 'Symbol', name: 'Aria label', localized: true },
    },
    { id: 'rel', spec: { type: 'Symbol', name: 'Rel', localized: false } },
    { id: 'title', spec: { type: 'Symbol', name: 'Title', localized: true } },
    {
      id: 'noFollow',
      spec: { type: 'Boolean', name: 'No follow', localized: false },
    },
    {
      id: 'noIndex',
      spec: { type: 'Boolean', name: 'No index', localized: false },
    },
    {
      id: 'target',
      spec: {
        type: 'Symbol',
        name: 'Target',
        validations: [{ in: ['_self', '_blank', '_parent', '_top'] }],
        localized: false,
      },
    },
  ],
}

const run: MigrationFunctionWithDefinition = async (migration: Migration) => {
  applyContentTypeFromDefinition(migration, definition)
}
export = run
