import { Injectable, Inject, Optional } from '@nestjs/common'
import { ALLOWED_DATA_SOURCES } from '@config/constants'
import type { DataSource } from '@config/constants'
import type {
  AllServices,
  AllAuthServices,
  LayoutService,
  PageService,
} from '@core/contracts/core/data-source-interfaces'
import type { CommercetoolsServiceProvider } from '@integrations/commercetools-api'
import type { ContentfulServiceProvider } from '@integrations/contentful-api'
import type { MockServiceProvider } from '@integrations/mock-api'
import type { CommercetoolsAuthServiceProvider } from '@integrations/commercetools-auth'
import type { AlgoliaServiceProvider } from '@integrations/algolia-api'
import { CtSearchProvider } from '@integrations/commercetools-api'
import type { SearchProvider } from '@core/contracts/product-search/search-provider'
import { DATA_SOURCE } from './tokens'

type CommercetoolsWithCMSServices = ReturnType<
  CommercetoolsServiceProvider['getServices']
> & {
  pageService: PageService
  layoutService: LayoutService
  searchService: SearchProvider
}

type MergedCommercetoolsCMSProvider = {
  getServices: () => CommercetoolsWithCMSServices
}

/** Only providers that include pageService + layoutService are stored in the map. */
type DataSourceServiceProvider =
  | MockServiceProvider
  | MergedCommercetoolsCMSProvider

@Injectable()
export class DataSourceFactory {
  private readonly serviceProviderMap: Map<
    DataSource,
    DataSourceServiceProvider
  >

  constructor(
    @Inject('COMMERCETOOLS_SERVICE_PROVIDER')
    private readonly commercetoolsServiceProvider: CommercetoolsServiceProvider,
    @Optional()
    @Inject('CONTENTFUL_SERVICE_PROVIDER')
    private readonly contentfulServiceProvider: ContentfulServiceProvider | null,
    @Inject('MOCK_SERVICE_PROVIDER')
    private readonly mockServiceProvider: MockServiceProvider,
    @Inject('COMMERCETOOLS_AUTH_SERVICE_PROVIDER')
    private readonly commercetoolsAuthServiceProvider: CommercetoolsAuthServiceProvider,
    @Optional()
    @Inject('ALGOLIA_SERVICE_PROVIDER')
    private readonly algoliaServiceProvider: AlgoliaServiceProvider | null,
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource
  ) {
    const commercetoolsWithCMS: MergedCommercetoolsCMSProvider = {
      getServices: (): CommercetoolsWithCMSServices => {
        const commercetools = this.commercetoolsServiceProvider.getServices()
        const ctSearchService = new CtSearchProvider(
          commercetools.productSearchService
        )
        if (this.contentfulServiceProvider) {
          return {
            ...commercetools,
            ...this.contentfulServiceProvider.getServices(),
            searchService: ctSearchService,
          }
        }
        const mock = this.mockServiceProvider.getServices()
        return {
          ...commercetools,
          pageService: mock.pageService,
          layoutService: mock.layoutService,
          searchService: ctSearchService,
        }
      },
    }

    const commercetoolsWithCMSWithAlgolia: MergedCommercetoolsCMSProvider = {
      getServices: (): CommercetoolsWithCMSServices => {
        const base = commercetoolsWithCMS.getServices()
        const { searchService } = this.algoliaServiceProvider!.getServices()
        return {
          ...base,
          searchService,
        }
      },
    }

    this.serviceProviderMap = new Map<DataSource, DataSourceServiceProvider>([
      ['commercetools-set', commercetoolsWithCMS],
      ['commercetools-algolia-set', commercetoolsWithCMSWithAlgolia],
      ['mock-set', this.mockServiceProvider],
    ])
  }

  getServices(): AllServices {
    const serviceProvider = this.serviceProviderMap.get(this.dataSource)
    if (!serviceProvider) {
      throw new Error(
        `Unknown data source: ${this.dataSource}. Allowed values: ${ALLOWED_DATA_SOURCES.join(', ')}`
      )
    }

    const baseServices = serviceProvider.getServices()

    // Always use commercetools customerService regardless of data source
    const { customerService, customerAddressService, orderService } =
      this.commercetoolsServiceProvider.getServices()

    // Always use mock paymentService regardless of data source
    const { paymentService } = this.mockServiceProvider.getServices()

    // For mock-set, wrap the CT productSearchService as a SearchProvider
    const searchService: SearchProvider =
      'searchService' in baseServices
        ? (baseServices as CommercetoolsWithCMSServices).searchService
        : new CtSearchProvider(
            this.commercetoolsServiceProvider.getServices().productSearchService
          )

    return {
      ...baseServices,
      customerService,
      customerAddressService,
      cartPaymentService: baseServices.cartPaymentService,
      paymentService,
      orderService,
      searchService,
    }
  }

  getAuthServices(): AllAuthServices {
    return this.commercetoolsAuthServiceProvider.getAuthServices()
  }
}
