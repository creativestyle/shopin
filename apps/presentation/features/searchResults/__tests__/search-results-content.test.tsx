import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { SearchResultsContent } from '../search-results-content'

const mockAddToCart = jest.fn((props: Record<string, unknown>) => (
  <button type='button'>{String(props.productId)}</button>
))

jest.mock('@/features/cart/cart-add-to-cart', () => ({
  AddToCart: (props: Record<string, unknown>) => mockAddToCart(props),
}))

jest.mock('@/components/ui/product-grid', () => ({
  ProductGrid: ({
    products,
    renderCardActions,
  }: {
    products: { id: string }[]
    renderCardActions: (product: { id: string }) => ReactNode
  }) => (
    <ul>
      {products.map((product) => (
        <li key={product.id}>{renderCardActions(product)}</li>
      ))}
    </ul>
  ),
}))

jest.mock(
  '@/features/productCollection/product-collection-toolbar-wrapper',
  () => ({ ProductCollectionToolbarWrapper: () => null })
)
jest.mock('@/features/productCollection/active-filters', () => ({
  ActiveFilters: () => null,
}))
jest.mock('@/components/ui/pagination-wrapper', () => ({
  PaginationWrapper: () => null,
}))
jest.mock('@/features/productCollection/use-filter-params', () => ({
  useFilterState: () => ({
    currentSort: undefined,
    saleOnly: false,
    priceMin: undefined,
    priceMax: undefined,
    currentFilters: {},
  }),
}))
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}))

const products = [
  {
    id: 'single',
    slug: 'single-product',
    name: 'Single Product',
    price: { regularPriceInCents: 1000, currency: 'USD' },
    image: { src: '/a.png', alt: 'Single Product' },
    variantId: '3',
    variantCount: 1,
  },
  {
    id: 'multi',
    slug: 'multi-product',
    name: 'Multi Product',
    price: { regularPriceInCents: 2000, currency: 'USD' },
    image: { src: '/b.png', alt: 'Multi Product' },
    variantId: '1',
    variantCount: 4,
  },
]

jest.mock('../hooks/use-product-search', () => ({
  useProductSearch: () => ({
    results: { products, facets: [], total: products.length },
    isLoading: false,
  }),
}))

describe('SearchResultsContent', () => {
  beforeEach(() => {
    mockAddToCart.mockClear()
  })

  it('passes variantId and variantCount of each product to AddToCart', () => {
    render(
      <SearchResultsContent
        locale='en'
        query='shirt'
      />
    )

    expect(mockAddToCart).toHaveBeenCalledTimes(2)
    expect(mockAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'single',
        productSlug: 'single-product',
        productName: 'Single Product',
        variantId: '3',
        variantCount: 1,
      })
    )
    expect(mockAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'multi',
        productSlug: 'multi-product',
        productName: 'Multi Product',
        variantId: '1',
        variantCount: 4,
      })
    )
  })
})
