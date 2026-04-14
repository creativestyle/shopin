import { Injectable, Inject, Optional } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
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
import {
  createAlgoliaClient,
  AlgoliaSearchService,
  type AlgoliaClient,
} from '@integrations/algolia-api'
import { CtSearchProvider } from '@integrations/commercetools-api'
import type { SearchProvider } from '@core/contracts/product-search/search-provider'
import { DATA_SOURCE } from './tokens'

type CommercetoolsWithCMSServices = ReturnType<
  CommercetoolsServiceProvider['getServices']
> & {
  pageService: PageService
  layoutService: LayoutService
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
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly configService: ConfigService
  ) {
    const commercetoolsWithCMS: MergedCommercetoolsCMSProvider = {
      getServices: (): CommercetoolsWithCMSServices => {
        const commercetools = this.commercetoolsServiceProvider.getServices()
        if (this.contentfulServiceProvider) {
          return {
            ...commercetools,
            ...this.contentfulServiceProvider.getServices(),
          }
        }
        const mock = this.mockServiceProvider.getServices()
        return {
          ...commercetools,
          pageService: mock.pageService,
          layoutService: mock.layoutService,
        }
      },
    }
    this.serviceProviderMap = new Map<DataSource, DataSourceServiceProvider>([
      ['commercetools-set', commercetoolsWithCMS],
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

    return {
      ...baseServices,
      customerService,
      customerAddressService,
      cartPaymentService: baseServices.cartPaymentService,
      paymentService,
      orderService,
    }
  }

  getAuthServices(): AllAuthServices {
    return this.commercetoolsAuthServiceProvider.getAuthServices()
  }

  shouldUseExternalSearch(): boolean {
    const provider = this.configService.get<string>('SEARCH_PROVIDER')
    if (provider === 'algolia') {
      return true
    }
    if (provider === 'commercetools') {
      return false
    }
    return !!this.configService.get<string>('ALGOLIA_APP_ID')
  }

  createAlgoliaClient(): { client: AlgoliaClient; indexName: string } {
    return createAlgoliaClient({
      appId: this.configService.getOrThrow<string>('ALGOLIA_APP_ID'),
      searchApiKey: this.configService.getOrThrow<string>(
        'ALGOLIA_SEARCH_API_KEY'
      ),
      indexName: this.configService.getOrThrow<string>('ALGOLIA_INDEX_NAME'),
    })
  }

  createSearchProvider(): SearchProvider {
    if (this.shouldUseExternalSearch()) {
      const { client, indexName } = this.createAlgoliaClient()
      return new AlgoliaSearchService(client, indexName)
    }
    const { productSearchService } =
      this.commercetoolsServiceProvider.getServices()
    return new CtSearchProvider(productSearchService)
  }
}
