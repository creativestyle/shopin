import { checkEndpoint, port } from '@core/integration-kit'
import { algoliaClientProviders } from './client/algolia-client.module'
import {
  AlgoliaServiceProviderImpl,
  AlgoliaMapperHooks,
} from './algolia-service-provider'
import type { AlgoliaMappers } from './mapper-hooks'
import { algoliaErrorMeaning } from './errors'

/** Algolia search port. Options arrive as PortOptions; the shop's card hook runs after the built-in mapper. */
export const searchPort = (mappers: AlgoliaMappers = {}) =>
  port('search', {
    providers: [
      { provide: AlgoliaMapperHooks, useValue: mappers },
      ...algoliaClientProviders,
      AlgoliaServiceProviderImpl,
    ],
    inject: [AlgoliaServiceProviderImpl],
    useFactory: (p: AlgoliaServiceProviderImpl) => ({
      searchService: p.getServices().searchService,
    }),
    // Algolia's errors as the shopper gets them (a refused query 400; key or index 502; unreachable 503)
    errors: algoliaErrorMeaning,
    // once at boot: the index's settings, read with the search key
    probe: (_search, options) =>
      checkEndpoint(
        `https://${options.appId}-dsn.algolia.net/1/indexes/${encodeURIComponent(String(options.indexName))}/settings`,
        {
          headers: {
            'X-Algolia-Application-Id': String(options.appId),
            'X-Algolia-API-Key': String(options.searchApiKey),
          },
        },
        {
          host: 'ALGOLIA_APP_ID',
          credentials: 'ALGOLIA_SEARCH_API_KEY',
          notFound: 'ALGOLIA_INDEX_NAME',
        }
      ),
  })

export default searchPort()
