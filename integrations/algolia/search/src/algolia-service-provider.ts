import { Injectable, Inject } from '@nestjs/common'
import type { AlgoliaServiceProvider } from './interfaces'
import type { AlgoliaClient } from './create-algolia-client'
import { AlgoliaSearchService } from './algolia-search.service'
import {
  ALGOLIA_CLIENT,
  ALGOLIA_INDEX_NAME,
} from './client/algolia-client.module'

@Injectable()
export class AlgoliaServiceProviderImpl implements AlgoliaServiceProvider {
  private readonly searchService: AlgoliaSearchService | null

  constructor(
    @Inject(ALGOLIA_CLIENT) client: AlgoliaClient | null,
    @Inject(ALGOLIA_INDEX_NAME) indexName: string | null
  ) {
    this.searchService =
      client && indexName ? new AlgoliaSearchService(client, indexName) : null
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
