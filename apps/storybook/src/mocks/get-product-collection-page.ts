/**
 * Mock for getProductCollectionPage used by TeaserProductCarouselBlock in Storybook.
 * Delivers mocked products so the product carousel renders without BFF.
 */
import type { ProductCollectionPageResponse } from '@core/contracts/product-collection/product-collection-page'
import { MOCK_PRODUCT_LIST } from './mock-product-list'

export async function getProductCollectionPage(
  _slug: string,
  ..._args: [page?: number, limit?: number]
): Promise<ProductCollectionPageResponse> {
  void _slug
  void _args
  return {
    breadcrumb: [{ label: 'Products', path: '/c' }],
    productList: MOCK_PRODUCT_LIST,
    total: MOCK_PRODUCT_LIST.length,
  }
}
