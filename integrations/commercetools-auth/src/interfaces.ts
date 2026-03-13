import type {
  BaseAuthServiceProvider,
  AllAuthServices,
} from '@core/contracts/core/data-source-interfaces'

export type CommercetoolsAuthServiceProvider =
  BaseAuthServiceProvider<AllAuthServices>
