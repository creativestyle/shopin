import type { BaseServiceProvider } from '@core/contracts/core/data-source-interfaces'
import type { MockServiceProviderImpl } from './mock-service-provider'

export type MockServiceProvider = BaseServiceProvider<
  ReturnType<MockServiceProviderImpl['getServices']>
>
