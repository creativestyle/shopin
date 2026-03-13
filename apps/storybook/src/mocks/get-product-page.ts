/**
 * Mock for getProductPage in Storybook.
 * Returns mock product data so async teaser renders without BFF.
 */
import type { ProductPageResponse } from '@core/contracts/product/product-page'

const mockProduct = {
  id: 'storybook-product-1',
  name: 'Classic White T-Shirt',
  slug: 'classic-white-tshirt',
  price: {
    regularPriceInCents: 2999,
    currency: 'EUR',
    fractionDigits: 2,
  },
  gallery: {
    images: [{ src: '/product-image.png', alt: 'Classic White T-Shirt' }],
  },
  description: 'A comfortable cotton t-shirt for everyday wear.',
}

export async function getProductPage(
  _slug: string,
  _variantId?: string
): Promise<ProductPageResponse> {
  void _variantId
  return {
    breadcrumb: [{ label: 'Products', path: '/c' }],
    product: {
      ...mockProduct,
      slug: _slug || mockProduct.slug,
      name: mockProduct.name,
    },
  }
}
