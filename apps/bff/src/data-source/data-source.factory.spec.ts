import type { DataSource } from '@config/constants'
import { DataSourceFactory } from './data-source.factory'

const SEARCH_RESULT = { products: [], facets: [], total: 0 }

function createStubProviders() {
  const ctServices = {
    productSearchService: {
      searchProducts: jest.fn().mockResolvedValue(SEARCH_RESULT),
    },
    orderService: { name: 'ct-order' },
    customerService: { name: 'ct-customer' },
    customerAddressService: { name: 'ct-customer-address' },
    cartService: { name: 'ct-cart' },
  }
  const mockServices = {
    productSearchService: {
      searchProducts: jest.fn().mockResolvedValue(SEARCH_RESULT),
    },
    orderService: { name: 'mock-order' },
    cartService: { name: 'mock-cart' },
  }
  const cmsServices = {
    pageService: { name: 'mock-page' },
    layoutService: { name: 'mock-layout' },
  }
  const pspServices = { paymentService: { name: 'mock-payment' } }
  const algoliaSearchService = { name: 'algolia-search' }

  return {
    commercetools: { getServices: () => ctServices },
    mock: { getServices: () => mockServices },
    cms: { getServices: () => cmsServices },
    psp: { getServices: () => pspServices },
    algolia: { getServices: () => ({ searchService: algoliaSearchService }) },
    auth: { getAuthServices: jest.fn() },
    ctServices,
    mockServices,
    cmsServices,
    pspServices,
    algoliaSearchService,
  }
}

function createFactory(dataSource: DataSource) {
  const stubs = createStubProviders()
  const factory = new DataSourceFactory(
    stubs.commercetools as never,
    null,
    stubs.mock as never,
    stubs.cms as never,
    stubs.psp as never,
    stubs.auth as never,
    stubs.algolia as never,
    dataSource
  )
  return { factory, stubs }
}

const search = (factory: DataSourceFactory) =>
  factory.getServices().searchService.searchProducts({
    query: 'shirt',
    language: 'en-US',
  })

describe('DataSourceFactory', () => {
  describe('mock-set', () => {
    it('searches through the mock commerce product search', async () => {
      const { factory, stubs } = createFactory('mock-set')
      await search(factory)

      expect(
        stubs.mockServices.productSearchService.searchProducts
      ).toHaveBeenCalledWith(expect.objectContaining({ query: 'shirt' }))
      expect(
        stubs.ctServices.productSearchService.searchProducts
      ).not.toHaveBeenCalled()
    })

    it('uses the mock order and cart services, the mock CMS and the mock payment', () => {
      const { factory, stubs } = createFactory('mock-set')
      const services = factory.getServices()

      expect(services.orderService).toBe(stubs.mockServices.orderService)
      expect(services.cartService).toBe(stubs.mockServices.cartService)
      expect(services.pageService).toBe(stubs.cmsServices.pageService)
      expect(services.layoutService).toBe(stubs.cmsServices.layoutService)
      expect(services.paymentService).toBe(stubs.pspServices.paymentService)
    })

    it('still uses commercetools customer services', () => {
      const { factory, stubs } = createFactory('mock-set')
      const services = factory.getServices()

      expect(services.customerService).toBe(stubs.ctServices.customerService)
      expect(services.customerAddressService).toBe(
        stubs.ctServices.customerAddressService
      )
    })
  })

  describe('commercetools-set', () => {
    it('searches through the commercetools product search', async () => {
      const { factory, stubs } = createFactory('commercetools-set')
      await search(factory)

      expect(
        stubs.ctServices.productSearchService.searchProducts
      ).toHaveBeenCalledWith(expect.objectContaining({ query: 'shirt' }))
      expect(
        stubs.mockServices.productSearchService.searchProducts
      ).not.toHaveBeenCalled()
    })

    it('uses the commercetools order service, the mock CMS fallback and the mock payment', () => {
      const { factory, stubs } = createFactory('commercetools-set')
      const services = factory.getServices()

      expect(services.orderService).toBe(stubs.ctServices.orderService)
      expect(services.pageService).toBe(stubs.cmsServices.pageService)
      expect(services.layoutService).toBe(stubs.cmsServices.layoutService)
      expect(services.paymentService).toBe(stubs.pspServices.paymentService)
    })
  })

  describe('commercetools-algolia-set', () => {
    it('uses the Algolia search provider', () => {
      const { factory, stubs } = createFactory('commercetools-algolia-set')

      expect(factory.getServices().searchService).toBe(
        stubs.algoliaSearchService
      )
    })

    it('uses the commercetools order service', () => {
      const { factory, stubs } = createFactory('commercetools-algolia-set')

      expect(factory.getServices().orderService).toBe(
        stubs.ctServices.orderService
      )
    })
  })

  it('throws for an unknown data source', () => {
    const { factory } = createFactory('unknown-set' as DataSource)

    expect(() => factory.getServices()).toThrow('Unknown data source')
  })
})
