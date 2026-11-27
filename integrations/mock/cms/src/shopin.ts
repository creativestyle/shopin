import { defineIntegration } from '@core/integration-kit'

/**
 * Mock CMS: pages, header and footer from in-code fixtures, no account needed. A part of mock data (id `mock`,
 * with `mock/commerce` and `mock/psp`): product carousels name a category slug of the mock catalog.
 */
export const mockCms = () =>
  defineIntegration({
    id: 'mock',
    label: { en: 'Sample data', de: 'Beispieldaten' },
    description: {
      en: 'Generated, works without any account',
      de: 'Erzeugt, ohne Konto nutzbar',
    },
    storefront: {
      contentImages: { hosts: ['placehold.co', 'storage.googleapis.com'] },
      // the same preview URL as Contentful's, so a draft preview can be tried on sample data
      slots: {
        cms: {
          PreviewRequest: '@integrations/mock-cms/preview#previewRequest',
        },
      },
    },
    /* eslint-disable @typescript-eslint/no-require-imports */
    ports: {
      // lazy on purpose: reading the config must not load Nest (see Integration.ports in the kit)
      cms: () =>
        (require('./parts/cms') as typeof import('./parts/cms')).default,
    },
    /* eslint-enable @typescript-eslint/no-require-imports */
  })
