import { defineIntegration } from '@core/integration-kit'
import type { MockOptions } from './options'

/**
 * Mock commerce: generated catalog, carts, wishlist, customers and orders, no account needed. One package per
 * category it serves (`mock/commerce`, `mock/cms`, `mock/psp`; one provider, id `mock`, whose parts the kit
 * merges). Its product search serves search through the BFF when no search integration is configured.
 */
export const mock = (options: MockOptions = {}) =>
  defineIntegration({
    id: 'mock',
    label: {
      en: 'Sample data: generated, works without any account',
      de: 'Beispieldaten: erzeugt, ohne Konto nutzbar',
    },
    mappers: options.mappers,
    storefront: {
      // placeholder and sample-catalogue images of the mock data
      productImages: { hosts: ['placehold.co', 'storage.googleapis.com'] },
    },
    // lazy on purpose: reading the config must not load Nest (see Integration.ports in the kit)
    /* eslint-disable @typescript-eslint/no-require-imports */
    ports: {
      commerce: () =>
        (
          require('./parts/commerce') as typeof import('./parts/commerce')
        ).commercePort(options),
    },
    /* eslint-enable @typescript-eslint/no-require-imports */
  })
