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
    for (const p of products) {expect(p.name).toContain('Shirt')}
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
    expect(two.total).toBe(one.total)
    const ids = new Set(one.products.map((p) => p.id))
    for (const p of two.products) {expect(ids.has(p.id)).toBe(false)}
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

  it('returns facets and a price range for the matches', async () => {
    const result = await (
      await createService()
    ).searchProducts({ query: 'shirt' })
    expect(result.facets?.length).toBeGreaterThan(0)
    expect(result.priceRange).toBeDefined()
  })
})
