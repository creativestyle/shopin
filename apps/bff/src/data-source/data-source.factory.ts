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
import type {
  MockAuthServiceProvider,
  MockServiceProvider,
} from '@integrations/mock-commerce'
import type { AlgoliaServiceProvider } from '@integrations/algolia-search'
import { CtSearchProvider } from '@integrations/commercetools-commerce'
import type { SearchProvider } from '@core/contracts/product-search/search-provider'
import type { CapabilitiesResponse } from '@core/contracts/capabilities/capabilities'
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

type CustomerServices = Pick<
  AllServices,
  'customerService' | 'customerAddressService'
>

/** Everything a data source is made of: no data source name is checked outside the map. */
interface DataSourceEntry {
  services: DataSourceServiceProvider
  customers: { getServices(): CustomerServices }
  auth: { getAuthServices(): AllAuthServices }
  /** Integration serving each category, reported by GET /bff/capabilities. */
  integrations: () => CapabilitiesResponse['integrations']
}

@Injectable()
export class DataSourceFactory {
  private readonly dataSourceMap: Map<DataSource, DataSourceEntry>

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
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
    @Inject('MOCK_AUTH_SERVICE_PROVIDER')
    private readonly mockAuthServiceProvider: MockAuthServiceProvider
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

    const commercetoolsEntry = (
      services: MergedCommercetoolsCMSProvider,
      search: string
    ): DataSourceEntry => ({
      services,
      customers: this.commercetoolsServiceProvider,
      auth: this.commercetoolsAuthServiceProvider,
      integrations: () => ({
        commerce: 'commercetools',
        search,
        cms: this.contentfulServiceProvider ? 'contentful' : 'mock',
        customer: 'commercetools',
        auth: 'commercetools',
        payment: 'mock',
      }),
    })

    this.dataSourceMap = new Map<DataSource, DataSourceEntry>([
      [
        'commercetools-set',
        commercetoolsEntry(commercetoolsWithCMS, 'commercetools'),
      ],
      [
        'commercetools-algolia-set',
        commercetoolsEntry(commercetoolsWithCMSWithAlgolia, 'algolia'),
      ],
      [
        'mock-set',
        {
          services: this.mockServiceProvider,
          customers: this.mockServiceProvider,
          auth: this.mockAuthServiceProvider,
          integrations: () => ({
            commerce: 'mock',
            search: 'mock',
            cms: 'mock',
            customer: 'mock',
            auth: 'mock',
            payment: 'mock',
          }),
        },
      ],
    ])
  }

  private getEntry(): DataSourceEntry {
    const entry = this.dataSourceMap.get(this.dataSource)
    if (!entry) {
      throw new Error(
        `Unknown data source: ${this.dataSource}. Allowed values: ${ALLOWED_DATA_SOURCES.join(', ')}`
      )
    }
    return entry
  }

  getServices(): AllServices {
    const entry = this.getEntry()
    const { customerService, customerAddressService } =
      entry.customers.getServices()

    // Always use mock paymentService regardless of data source
    const { paymentService } = this.mockServiceProvider.getServices()

    return {
      ...entry.services.getServices(),
      customerService,
      customerAddressService,
      paymentService,
    }
  }

  getAuthServices(): AllAuthServices {
    return this.getEntry().auth.getAuthServices()
  }

  getCapabilities(): CapabilitiesResponse {
    return {
      dataSource: this.dataSource,
      integrations: this.getEntry().integrations(),
    }
  }
}
