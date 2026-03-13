import { ProductService } from '../product/product.service'

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
    limit: number
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

describe('ProductService', () => {
  let service: ProductService
  let factory: MockDataSourceFactory

  beforeEach(() => {
    factory = new MockDataSourceFactory()
    service = new ProductService(factory as unknown as never)
  })

  it('getProductPage composes page response from product', async () => {
    const getProduct = jest.fn().mockResolvedValue({
      product: { id: 'p1' },
      breadcrumb: [{ label: 'Home', path: '/' }],
    })
    factory.getServices.mockReturnValue({
      productService: {
        getProduct,
      },
      productCollectionService: {
        getProductCollection: async () => ({
          productList: [],
          breadcrumb: [],
          total: 0,
        }),
      },
    })
    const r = await service.getProductPage('p1')
    expect(getProduct).toHaveBeenCalledWith('p1', undefined)
    expect(r).toStrictEqual({
      product: { id: 'p1' },
      breadcrumb: [{ label: 'Home', path: '/' }],
    })
  })
})
