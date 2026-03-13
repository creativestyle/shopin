import type { ContentfulServiceProviderImpl } from './contentful-service-provider'

export type ContentfulServiceProvider = {
  getServices(): ReturnType<ContentfulServiceProviderImpl['getServices']>
}
