import { CtSearchProvider } from '@integrations/commercetools-api'
import type { DataSource } from '@config/constants'
import { DataSourceFactory } from './data-source.factory'

function createStubProviders() {
  const ctOrderService = { name: 'ct-order' }
  const ctServices = {
    productSearchService: { name: 'ct-product-search' },
    orderService: ctOrderService,
    customerService: { name: 'ct-customer' },
    customerAddressService: { name: 'ct-customer-address' },
    cartService: { name: 'ct-cart' },
  }
  const mockSearchService = { name: 'mock-search' }
  const mockOrderService = { name: 'mock-order' }
  const mockServices = {
    searchService: mockSearchService,
    orderService: mockOrderService,
    cartService: { name: 'mock-cart' },
    paymentService: { name: 'mock-payment' },
    pageService: { name: 'mock-page' },
    layoutService: { name: 'mock-layout' },
    customerService: { name: 'mock-customer' },
    customerAddressService: { name: 'mock-customer-address' },
  }
  const ctAuthServices = { loginService: { name: 'ct-login' } }
  const mockAuthServices = { loginService: { name: 'mock-login' } }
  const algoliaSearchService = { name: 'algolia-search' }

  return {
    commercetools: { getServices: () => ctServices },
    mock: { getServices: () => mockServices },
    algolia: { getServices: () => ({ searchService: algoliaSearchService }) },
    auth: { getAuthServices: () => ctAuthServices },
    mockAuth: { getAuthServices: () => mockAuthServices },
    ctServices,
    mockServices,
    algoliaSearchService,
    ctAuthServices,
    mockAuthServices,
  }
}

function createFactory(dataSource: DataSource) {
  const stubs = createStubProviders()
  const factory = new DataSourceFactory(
    stubs.commercetools as never,
    null,
    stubs.mock as never,
    stubs.auth as never,
    stubs.algolia as never,
    dataSource,
    stubs.mockAuth as never
  )
  return { factory, stubs }
}

describe('DataSourceFactory', () => {
  describe('mock-set', () => {
    it('uses the mock search, order and cart services', () => {
      const { factory, stubs } = createFactory('mock-set')
      const services = factory.getServices()

      expect(services.searchService).toBe(stubs.mockServices.searchService)
      expect(services.orderService).toBe(stubs.mockServices.orderService)
      expect(services.cartService).toBe(stubs.mockServices.cartService)
    })

    it('uses the mock customer services', () => {
      const { factory, stubs } = createFactory('mock-set')
      const services = factory.getServices()

      expect(services.customerService).toBe(stubs.mockServices.customerService)
      expect(services.customerAddressService).toBe(
        stubs.mockServices.customerAddressService
      )
    })

    it('uses the mock auth services', () => {
      const { factory, stubs } = createFactory('mock-set')

      expect(factory.getAuthServices()).toBe(stubs.mockAuthServices)
    })
  })

  describe('commercetools-set', () => {
    it('uses commercetools customer and auth services', () => {
      const { factory, stubs } = createFactory('commercetools-set')
      const services = factory.getServices()

      expect(services.customerService).toBe(stubs.ctServices.customerService)
      expect(factory.getAuthServices()).toBe(stubs.ctAuthServices)
    })

    it('wraps commercetools product search in CtSearchProvider', () => {
      const { factory } = createFactory('commercetools-set')

      expect(factory.getServices().searchService).toBeInstanceOf(
        CtSearchProvider
      )
    })

    it('uses the commercetools order service and mock page/layout fallback', () => {
      const { factory, stubs } = createFactory('commercetools-set')
      const services = factory.getServices()

      expect(services.orderService).toBe(stubs.ctServices.orderService)
      expect(services.pageService).toBe(stubs.mockServices.pageService)
      expect(services.paymentService).toBe(stubs.mockServices.paymentService)
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
