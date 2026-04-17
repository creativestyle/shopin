import type { AlgoliaSearchService } from './algolia-search.service'

export interface AlgoliaServiceProvider {
  getServices(): { searchService: AlgoliaSearchService }
}
