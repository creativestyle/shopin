import { defineIntegration } from '@core/integration-kit'
import { commercetoolsCommerceEnv } from '@integrations/commercetools-core/env'
import type { CommercetoolsMappers } from './mapper-hooks'
import type { StoreKeys } from './config/stores'

export interface CommercetoolsOptions {
  /** Product image CDN host(s) of the project's region. */
  imageHosts?: string[]
  /** The shop's mapper hooks, run after the built-in mappers (docs/extending.md). */
  mappers?: CommercetoolsMappers
  /**
   * The commercetools Store per locale of config/locales.json: `{ "en-US": "us-store", "de-DE": "eu-store" }`.
   * COMMERCETOOLS_STORE_KEYS gives the store of a locale it leaves out. Every locale needs one; the BFF's start says which lack it.
   */
  storeKeys?: StoreKeys
}

/**
 * The commerce part of commercetools (catalog, carts, customers, orders; its product search serves search through
 * the BFF when no search integration is configured). Its sign-in is the auth part, `@integrations/commercetools-auth`
 * (same id: one provider); both share `@integrations/commercetools-core`.
 */
export const commercetools = (options: CommercetoolsOptions = {}) =>
  defineIntegration({
    id: 'commercetools',
    label: 'commercetools',
    description: {
      en: "The project's catalog, carts, customer accounts and product search",
      de: 'Katalog, Warenkörbe, Kundenkonten und Produktsuche des Projekts',
    },
    mappers: options.mappers,
    env: {
      commerce: {
        ...commercetoolsCommerceEnv,
        // a store per locale: needed unless the factory option names one for every locale of the shop
        storeKeys: {
          ...commercetoolsCommerceEnv.storeKeys,
          requiredWhen: ({ locales }) => {
            const missing = locales.filter((l) => !options.storeKeys?.[l])
            return missing.length
              ? `the commercetools Store per locale, as en-US:us-store,de-DE:eu-store (no storeKeys option for ${missing.join(', ')})`
              : undefined
          },
        },
        // sign-in through another identity provider creates or links customers in this project
        linkCustomers: {
          ...commercetoolsCommerceEnv.linkCustomers,
          requiredWhen: ({ providers }) => {
            const other = providers.auth?.find((id) => id !== 'commercetools')
            return other
              ? `sign-in is through "${other}", so the BFF creates or links customers in this commercetools project: set it to 1 to allow that`
              : undefined
          },
        },
      },
    },
    // lazy: a port's Nest module and SDK load only when the config chooses it
    /* eslint-disable @typescript-eslint/no-require-imports */
    ports: {
      commerce: () =>
        (
          require('./parts/commerce') as typeof import('./parts/commerce')
        ).commercePort(options.mappers, options.storeKeys),
    },
    storefront: {
      // pre-generated size variants by filename suffix (image-thumb.jpg … image-zoom.jpg)
      productImages: {
        hosts: options.imageHosts ?? [
          'images.eu-central-1.aws.commercetools.com',
        ],
        resize: {
          kind: 'suffix',
          steps: [
            { maxWidth: 50, suffix: '-thumb' },
            { maxWidth: 150, suffix: '-small' },
            { maxWidth: 400, suffix: '-medium' },
            { maxWidth: 700, suffix: '-large' },
          ],
          largest: '-zoom',
        },
      },
    },
  })
