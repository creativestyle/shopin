import { Injectable, Inject, Optional } from '@nestjs/common'
import { ALLOWED_DATA_SOURCES } from '@config/constants'
import type { DataSource } from '@config/constants'
import type {
  AllServices,
  AllAuthServices,
  LayoutService,
  PageService,
} from '@core/contracts/core/data-source-interfaces'
import type { CommercetoolsServiceProvider } from '@integrations/commercetools-commerce'
import type { CommercetoolsAuthServiceProvider } from '@integrations/commercetools-auth'
import type { ContentfulServiceProvider } from '@integrations/contentful-cms'
import type { MockServiceProvider } from '@integrations/mock-commerce'
import type { MockCmsServiceProvider } from '@integrations/mock-cms'
import type { MockPspServiceProvider } from '@integrations/mock-psp'
import { CommerceSearchProvider } from './commerce-search.provider'
import type { AlgoliaServiceProvider } from '@integrations/algolia-search'
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

/** Every set in the map serves commerce, CMS and search; customer services and payment are added for all sets. */
type DataSourceServiceProvider = {
  getServices: () => Omit<
    AllServices,
    'customerService' | 'customerAddressService' | 'paymentService'
  >
}

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
    @Inject('MOCK_CMS_SERVICE_PROVIDER')
    private readonly mockCmsServiceProvider: MockCmsServiceProvider,
    @Inject('MOCK_PSP_SERVICE_PROVIDER')
    private readonly mockPspServiceProvider: MockPspServiceProvider,
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
        const ctSearchService = new CommerceSearchProvider(
          commercetools.productSearchService
        )
        if (this.contentfulServiceProvider) {
          return {
            ...commercetools,
            ...this.contentfulServiceProvider.getServices(),
            searchService: ctSearchService,
          }
        }
        return {
          ...commercetools,
          ...this.mockCmsServiceProvider.getServices(),
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

    const mockSet: DataSourceServiceProvider = {
      getServices: () => {
        const mock = this.mockServiceProvider.getServices()
        return {
          ...mock,
          ...this.mockCmsServiceProvider.getServices(),
          searchService: new CommerceSearchProvider(mock.productSearchService),
        }
      },
    }

    this.serviceProviderMap = new Map<DataSource, DataSourceServiceProvider>([
      ['commercetools-set', commercetoolsWithCMS],
      ['commercetools-algolia-set', commercetoolsWithCMSWithAlgolia],
      ['mock-set', mockSet],
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
    const { customerService, customerAddressService } =
      this.commercetoolsServiceProvider.getServices()

    // Always use the mock payment provider regardless of data source
    const { paymentService } = this.mockPspServiceProvider.getServices()

    return {
      ...baseServices,
      customerService,
      customerAddressService,
      paymentService,
    }
  }

  getAuthServices(): AllAuthServices {
    return this.commercetoolsAuthServiceProvider.getAuthServices()
  }
}
