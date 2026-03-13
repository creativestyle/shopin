/**
 * Page content type (slug, pageTitle, pageTitleVisibility, parentPage, components, SEO).
 * Must run before Link (01-01-02): Link has linkedPage with linkContentType: ['page'], so the Page content type must exist first.
 * Fails if content type already exists.
 */
import { PAGE_COMPONENT_IDS } from '../lib/content-types/ids'
import type Migration from 'contentful-migration'
import type { ContentTypeDefinition } from '../lib/content-type'
import { applyContentTypeFromDefinition } from '../lib/content-type'

const definition: ContentTypeDefinition = {
  id: 'page',
  name: 'Page',
  description:
    'Content page with all data to generate page: slug, page title, title visibility, parent for breadcrumb, SEO fields, and components.',
  displayField: 'pageTitle',
  fields: [
    {
      id: 'slug',
      spec: {
        type: 'Symbol',
        name: 'Slug',
        required: true,
        validations: [{ unique: true }],
        localized: true,
      },
    },
    {
      id: 'pageTitle',
      spec: { type: 'Symbol', name: 'Page Title', localized: true },
    },
    {
      id: 'pageTitleVisibility',
      spec: {
        type: 'Symbol',
        name: 'Page Title Visibility',
        validations: [{ in: ['visible', 'srOnly'] }],
        localized: false,
      },
    },
    {
      id: 'parentPage',
      spec: {
        type: 'Link',
        name: 'Parent Page',
        linkType: 'Entry',
        validations: [{ linkContentType: ['page'] }],
        localized: false,
      },
    },
    {
      id: 'metaTitle',
      spec: { type: 'Symbol', name: 'Meta Title (SEO)', localized: true },
    },
    {
      id: 'metaDescription',
      spec: { type: 'Text', name: 'Meta Description (SEO)', localized: true },
    },
    {
      id: 'ogImage',
      spec: {
        type: 'Link',
        name: 'OG Image (SEO)',
        linkType: 'Asset',
        localized: false,
      },
    },
    {
      id: 'noIndex',
      spec: { type: 'Boolean', name: 'No Index (SEO)', localized: false },
    },
    {
      id: 'components',
      spec: {
        type: 'Array',
        name: 'Components',
        items: {
          type: 'Link',
          linkType: 'Entry',
          validations: [{ linkContentType: [...PAGE_COMPONENT_IDS] }],
        },
        localized: false,
      },
    },
  ],
}

async function run(migration: Migration) {
  applyContentTypeFromDefinition(migration, definition)
}

export = run
