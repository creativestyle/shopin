import type { PortOptions } from '@core/integration-kit'

/** Env of the Algolia search part (read by the BFF, handed over as options). */
export const algoliaEnv = {
  appId: { env: 'ALGOLIA_APP_ID' },
  searchApiKey: { env: 'ALGOLIA_SEARCH_API_KEY' },
  indexName: { env: 'ALGOLIA_INDEX_NAME' },
} as const
export type AlgoliaOptions = PortOptions.Of<typeof algoliaEnv>
