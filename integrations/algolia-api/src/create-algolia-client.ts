import { algoliasearch } from 'algoliasearch'
export type { SearchResponse } from 'algoliasearch'

export interface AlgoliaClientConfig {
  appId: string
  searchApiKey: string
  indexName: string
}

export type AlgoliaClient = ReturnType<typeof algoliasearch>

export function createAlgoliaClient(config: AlgoliaClientConfig) {
  return {
    client: algoliasearch(config.appId, config.searchApiKey),
    indexName: config.indexName,
  }
}
