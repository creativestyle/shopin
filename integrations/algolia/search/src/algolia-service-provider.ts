import { Injectable, Inject, Optional } from '@nestjs/common'
import type { AlgoliaMappers } from './mapper-hooks'
import type { AlgoliaServiceProvider } from './interfaces'
import type { AlgoliaClient } from './create-algolia-client'
import { AlgoliaSearchService } from './algolia-search.service'
import {
  ALGOLIA_CLIENT,
  ALGOLIA_INDEX_NAME,
} from './client/algolia-client.module'

/** The shop's mapper hooks as the port receives them (a Nest provider). */
export abstract class AlgoliaMapperHooks implements AlgoliaMappers {
  abstract readonly productCard?: AlgoliaMappers['productCard']
}

@Injectable()
export class AlgoliaServiceProviderImpl implements AlgoliaServiceProvider {
  private readonly searchService: AlgoliaSearchService | null

  constructor(
    @Inject(ALGOLIA_CLIENT) client: AlgoliaClient | null,
    @Inject(ALGOLIA_INDEX_NAME) indexName: string | null,
    @Optional() hooks?: AlgoliaMapperHooks
  ) {
    this.searchService =
      client && indexName
        ? new AlgoliaSearchService(client, indexName, hooks?.productCard)
        : null
  }

  getServices() {
    if (!this.searchService) {
      throw new Error(
        'Algolia search service is not available. ' +
          'Check that ALGOLIA_APP_ID, ALGOLIA_SEARCH_API_KEY, and ALGOLIA_INDEX_NAME env vars are set.'
      )
    }
    return {
      searchService: this.searchService,
    }
  }
}
