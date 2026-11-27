import type { Provider } from '@nestjs/common'
import { PortOptions } from '@core/integration-kit'
import {
  createAlgoliaClient,
  type AlgoliaClient,
} from '../create-algolia-client'
import type { AlgoliaOptions } from '../env'

export const ALGOLIA_CLIENT = 'ALGOLIA_CLIENT'
export const ALGOLIA_INDEX_NAME = 'ALGOLIA_INDEX_NAME'

/** The Algolia client, built from the search part's PortOptions. */
export const algoliaClientProviders: Provider[] = [
  {
    provide: ALGOLIA_CLIENT,
    inject: [PortOptions],
    useFactory: (o: AlgoliaOptions): AlgoliaClient =>
      createAlgoliaClient(o).client,
  },
  {
    provide: ALGOLIA_INDEX_NAME,
    inject: [PortOptions],
    useFactory: (o: AlgoliaOptions) => o.indexName,
  },
]
