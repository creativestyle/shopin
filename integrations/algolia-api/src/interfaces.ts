import type { AlgoliaServiceProviderImpl } from './algolia-service-provider'

export interface AlgoliaServiceProvider {
  getServices(): ReturnType<AlgoliaServiceProviderImpl['getServices']>
}
