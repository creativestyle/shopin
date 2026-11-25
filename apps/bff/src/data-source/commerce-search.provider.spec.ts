import type { ProductSearchService } from '@core/contracts/core/data-source-interfaces'
import { SUGGESTION_FETCH_SIZE } from '@core/contracts/product-search/search-provider'
import { DEFAULT_SUGGESTION_LIMIT } from '@config/constants'
import { CommerceSearchProvider } from './commerce-search.provider'

const card = (name: string) => ({
  id: name,
  slug: name.toLowerCase().replace(/ /g, '-'),
  name,
  image: { url: 'https://img.test/x.png', alt: name },
})

function setup(products = [card('Blue Shirt'), card('Blue Jeans')]) {
  const searchProducts = jest.fn().mockResolvedValue({
    suggestions: ['ignored'],
    products,
    facets: [{ name: 'color', label: 'Color', type: 'term', values: [] }],
    priceRange: { min: 1, max: 9 },
    total: products.length,
  })
  const service = { searchProducts } as unknown as ProductSearchService
  return { provider: new CommerceSearchProvider(service), searchProducts }
}

describe('CommerceSearchProvider', () => {
  it('asks the commerce product search with facets on and every search option passed through', async () => {
    const { provider, searchProducts } = setup()
    await provider.searchProducts({
      query: 'blue',
      language: 'en-US',
      limit: 12,
      page: 2,
      filters: { color: ['blue'] },
      priceMin: 10,
      priceMax: 50,
      sort: 'price-asc',
      saleOnly: true,
    })
    expect(searchProducts).toHaveBeenCalledWith({
      query: 'blue',
      faceted: true,
      limit: 12,
      page: 2,
      filters: { color: ['blue'] },
      priceMin: 10,
      priceMax: 50,
      sort: 'price-asc',
      saleOnly: true,
    })
  })

  it('returns products, facets, price range and total, and drops the platform suggestions', async () => {
    const { provider } = setup()
    const result = await provider.searchProducts({
      query: 'blue',
      language: 'en-US',
    })
    expect(result).toEqual({
      products: [card('Blue Shirt'), card('Blue Jeans')],
      facets: [{ name: 'color', label: 'Color', type: 'term', values: [] }],
      priceRange: { min: 1, max: 9 },
      total: 2,
    })
  })

  it('builds suggestions from the names of the first matches, fetching SUGGESTION_FETCH_SIZE of them', async () => {
    const { provider, searchProducts } = setup()
    const suggestions = await provider.getSuggestions('blu', 'en-US')
    expect(searchProducts).toHaveBeenCalledWith({
      query: 'blu',
      limit: SUGGESTION_FETCH_SIZE,
    })
    expect(suggestions.length).toBeGreaterThan(0)
    expect(suggestions.length).toBeLessThanOrEqual(DEFAULT_SUGGESTION_LIMIT)
    for (const s of suggestions) {
      expect(s.toLowerCase()).toContain('blu')
    }
  })

  it('caps suggestions at the limit asked for', async () => {
    const { provider } = setup([
      card('Blue Shirt'),
      card('Blue Jeans'),
      card('Blue Hat'),
      card('Blue Sock'),
    ])
    expect(await provider.getSuggestions('blue', 'en-US', 2)).toHaveLength(2)
  })
})
