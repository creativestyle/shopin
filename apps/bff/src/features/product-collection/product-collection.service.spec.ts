import { ProductCollectionService } from '../product-collection/product-collection.service'
import { ITEMS_PER_PAGE, DEFAULT_SORT_OPTION } from '@config/constants'
import type { Filters } from '@core/contracts/product-collection/product-collection-page'

interface ProductServicePort {
  getProduct: (
    k: string,
    variantId?: string
  ) => Promise<{
    product: unknown
    breadcrumb: unknown[]
  }>
}

interface ProductCollectionServicePort {
  getProductCollection: (
    k: string,
    page: number,
    limit: number,
    sort: string,
    filters?: Filters,
    saleOnly?: boolean,
    priceMin?: number,
    priceMax?: number
  ) => Promise<{
    productList: unknown[]
    breadcrumb: unknown[]
    total: number
  }>
}

type Services = {
  productService: ProductServicePort
  productCollectionService: ProductCollectionServicePort
}

class MockDataSourceFactory {
  getServices = jest.fn<Services, []>()
}

describe('ProductCollectionService', () => {
  let service: ProductCollectionService
  let factory: MockDataSourceFactory

  beforeEach(() => {
    factory = new MockDataSourceFactory()
    service = new ProductCollectionService(factory as unknown as never)
  })

  it('getProductCollectionPage composes page response from product collection', async () => {
    const getProductCollection = jest.fn().mockResolvedValue({
      productList: [{ id: 'p1' }],
      breadcrumb: [{ label: 'Category', path: '/c/category' }],
      total: 100,
    })
    factory.getServices.mockReturnValue({
      productService: {
        getProduct: async () => ({
          product: {},
          breadcrumb: [],
        }),
      },
      productCollectionService: {
        getProductCollection,
      },
    })
    const r = await service.getProductCollectionPage('c1', 1, ITEMS_PER_PAGE)
    expect(getProductCollection).toHaveBeenCalledWith(
      'c1',
      1,
      ITEMS_PER_PAGE,
      DEFAULT_SORT_OPTION,
      undefined,
      false,
      undefined,
      undefined
    )
    expect(r).toStrictEqual({
      productList: [{ id: 'p1' }],
      breadcrumb: [{ label: 'Category', path: '/c/category' }],
      total: 100,
      facets: undefined,
      priceRange: undefined,
      categoryTree: undefined,
      currentCategoryId: undefined,
    })
  })
})
