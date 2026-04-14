export {
  type AlgoliaClientConfig,
  type AlgoliaClient,
  type SearchResponse,
  createAlgoliaClient,
} from './create-algolia-client'

export { AlgoliaApiModule } from './algolia-api.module'
export { AlgoliaServiceProviderImpl } from './algolia-service-provider'
export type { AlgoliaServiceProvider } from './interfaces'

export { AlgoliaSearchService } from './algolia-search.service'

export {
  type AlgoliaProductHit,
  mapAlgoliaHitToProduct,
} from './mappers/algolia-hit-to-product'

export {
  type AttributeMetadata,
  mapAlgoliaFacets,
  mergeAlgoliaFacets,
} from './mappers/algolia-facets'

export { mapAlgoliaPriceRange } from './mappers/algolia-price-range'

export {
  inferDisplayType,
  extractColorHex,
  stripColorSuffix,
} from './mappers/algolia-facet-utils'

export {
  type AlgoliaFieldNames,
  buildAlgoliaFieldNames,
  buildFacetAttributeNames,
  buildAlgoliaFacetFilters,
  buildAlgoliaNumericFilters,
} from './mappers/algolia-query-utils'
