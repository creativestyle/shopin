import { ProductService } from '../src/services/product.service'

function createService(
  language: string,
  meta: {
    metaTitle?: Record<string, string>
    metaDescription?: Record<string, string>
  }
) {
  const product = {
    id: 'product-1',
    createdAt: '2020-01-01T00:00:00.000Z',
    name: { [language]: 'Shirt' },
    slug: { [language]: 'shirt' },
    masterVariant: { id: 1, sku: 'SKU-1' },
    ...meta,
  }
  const get = jest.fn().mockReturnValue({
    execute: jest.fn().mockResolvedValue({ body: { results: [product] } }),
  })
  const client = { productProjections: () => ({ get }) }
  const languageProvider = { getCurrentLanguage: () => language }
  return new ProductService(client as never, languageProvider as never)
}

describe('CommercetoolsProductService seo mapping', () => {
  it('maps metaTitle and metaDescription for the current language', async () => {
    const service = createService('de-DE', {
      metaTitle: { 'de-DE': 'Hemd kaufen', 'en-US': 'Buy shirt' },
      metaDescription: { 'de-DE': ' Bequemes Hemd ', 'en-US': 'Comfy shirt' },
    })

    const { seo } = await service.getProduct('shirt')

    expect(seo).toEqual({
      metaTitle: 'Hemd kaufen',
      metaDescription: 'Bequemes Hemd',
    })
  })

  it('maps a single field when only one is set', async () => {
    const service = createService('en-US', {
      metaDescription: { 'en-US': 'Comfy shirt' },
    })

    const { seo } = await service.getProduct('shirt')

    expect(seo).toEqual({ metaDescription: 'Comfy shirt' })
  })

  it('does not fall back to another language', async () => {
    const service = createService('de-DE', {
      metaTitle: { 'en-US': 'Buy shirt' },
      metaDescription: { 'en-US': 'Comfy shirt', 'de-DE': '   ' },
    })

    const { seo } = await service.getProduct('shirt')

    expect(seo).toBeUndefined()
  })

  it('keeps metaDescription in the visible seoText block', async () => {
    const service = createService('en-US', {
      metaDescription: { 'en-US': 'Comfy shirt' },
    })

    const { product } = await service.getProduct('shirt')

    expect(product.seoText).toBe('Comfy shirt')
  })
})
