import { MockApi } from '../client/client.module'
import { ProductSearchService } from '../services/product-search.service'

async function createService(language = 'en-US') {
  const { faker, fakerDE } = await import('@faker-js/faker')
  const languageProvider = { getCurrentLanguage: () => language }
  const mockApi = new MockApi(languageProvider as never, { faker, fakerDE })
  return new ProductSearchService(mockApi, languageProvider as never)
}

describe('mock ProductSearchService', () => {
  it('finds nothing for an empty query', async () => {
    const service = await createService()
    expect(await service.searchProducts({ query: '  ' })).toEqual({
      products: [],
      facets: [],
      total: 0,
    })
  })

  it('answers the same query with the same products, so repeated searches and suggestions agree', async () => {
    const first = await (
      await createService()
    ).searchProducts({ query: 'shirt' })
    const again = await (
      await createService()
    ).searchProducts({ query: 'shirt' })
    expect(first.total).toBeGreaterThan(0)
    expect(again).toEqual(first)
  })

  it('names every match after the query', async () => {
    const { products } = await (
      await createService()
    ).searchProducts({ query: 'shirt', limit: 50 })
    expect(products.length).toBeGreaterThan(0)
    for (const p of products) {
      expect(p.name).toContain('Shirt')
    }
  })

  it('pages through the matches: pages do not overlap and the total stays the same', async () => {
    const service = await createService()
    const one = await service.searchProducts({
      query: 'shirt',
      limit: 3,
      page: 1,
    })
    const two = await service.searchProducts({
      query: 'shirt',
      limit: 3,
      page: 2,
    })
    expect(one.products).toHaveLength(3)
    expect(two.products).toHaveLength(3)
    expect(two.total).toBe(one.total)
    const ids = new Set(one.products.map((p) => p.id))
    for (const p of two.products) {
      expect(ids.has(p.id)).toBe(false)
    }
  })

  it('prices in the currency of the current language', async () => {
    const en = await (
      await createService('en-US')
    ).searchProducts({ query: 'shirt' })
    const de = await (
      await createService('de-DE')
    ).searchProducts({ query: 'shirt' })
    expect(en.products.find((p) => p.price)?.price?.currency).toBe('USD')
    expect(de.products.find((p) => p.price)?.price?.currency).toBe('EUR')
  })

  const effective = (p: {
    price?: { regularPriceInCents: number; discountedPriceInCents?: number }
  }) => p.price?.discountedPriceInCents ?? p.price?.regularPriceInCents

  it('returns facets and a price range that covers every match', async () => {
    const result = await (
      await createService()
    ).searchProducts({ query: 'shirt', limit: 60 })
    expect(result.facets?.length).toBeGreaterThan(0)
    const { minPriceInCents, maxPriceInCents } = result.priceRange!
    expect(minPriceInCents).toBeLessThanOrEqual(maxPriceInCents)
    for (const p of result.products) {
      const price = effective(p)!
      expect(price).toBeGreaterThanOrEqual(minPriceInCents)
      expect(price).toBeLessThanOrEqual(maxPriceInCents)
    }
  })

  it('keeps only products on sale when asked', async () => {
    const service = await createService()
    const all = await service.searchProducts({ query: 'shirt', limit: 60 })
    const sale = await service.searchProducts({
      query: 'shirt',
      limit: 60,
      saleOnly: true,
    })
    expect(sale.total).toBeLessThan(all.total)
    for (const p of sale.products) {
      expect(p.price?.discountedPriceInCents).toBeDefined()
    }
  })

  it('keeps only products within the price bounds, against the unfiltered price range', async () => {
    const service = await createService()
    const all = await service.searchProducts({ query: 'shirt', limit: 60 })
    const { minPriceInCents, maxPriceInCents } = all.priceRange!
    const priceMax = Math.floor((minPriceInCents + maxPriceInCents) / 2)
    const cheap = await service.searchProducts({
      query: 'shirt',
      limit: 60,
      priceMax,
    })
    expect(cheap.total).toBeGreaterThan(0)
    expect(cheap.total).toBeLessThan(all.total)
    for (const p of cheap.products) {
      expect(effective(p)).toBeLessThanOrEqual(priceMax)
    }
    // the range describes all matches, so the price filter can be widened again
    expect(cheap.priceRange).toEqual(all.priceRange)
    const expensive = await service.searchProducts({
      query: 'shirt',
      limit: 60,
      priceMin: priceMax + 1,
    })
    expect(expensive.total + cheap.total).toBe(all.total)
  })
})
