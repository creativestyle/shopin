import { defineIntegration } from '@core/integration-kit'
import { algoliaEnv } from './env'
import type { AlgoliaMappers } from './mapper-hooks'

export interface AlgoliaOptions {
  /** The shop's mapper hooks, run after the built-in mapper (docs/extending.md). */
  mappers?: AlgoliaMappers
}

/**
 * Algolia search over the index the commercetools sync tool feeds (commercetools-algolia-sync): it serves only with
 * commercetools commerce; setup refuses it over another commerce integration, with the command that fixes it.
 */
export const algolia = (options: AlgoliaOptions = {}) => {
  return defineIntegration({
    id: 'algolia',
    label: 'Algolia',
    description: {
      en: 'Search results from the index',
      de: 'Suchergebnisse aus dem Index',
    },
    mappers: options.mappers,
    requires: {
      search: {
        needs: { commerce: 'commercetools' },
        reason: {
          en: 'The Algolia index is fed from commercetools',
          de: 'Der Algolia-Index wird aus commercetools befüllt',
        },
      },
    },
    env: { search: algoliaEnv },
    ports: {
      search: () =>
        // lazy on purpose: reading the config must not load Nest or the Algolia client (see Integration.ports)
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        (require('./bff') as typeof import('./bff')).searchPort(
          options.mappers
        ),
    },
  })
}
