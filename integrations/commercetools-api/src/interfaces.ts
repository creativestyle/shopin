import type { BaseServiceProvider } from '@core/contracts/core/data-source-interfaces'
import type { CommercetoolsServiceProviderImpl } from './commercetools-service-provider'

export type CommercetoolsServiceProvider = BaseServiceProvider<
  ReturnType<CommercetoolsServiceProviderImpl['getServices']>
>
