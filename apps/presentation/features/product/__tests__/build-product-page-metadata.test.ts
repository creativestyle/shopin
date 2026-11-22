/**
 * @jest-environment node
 */
import type { ProductPageResponse } from '@core/contracts/product/product-page'
import { buildProductPageMetadata } from '../build-product-page-metadata'
import { DEFAULT_OG_IMAGE } from '@/features/seo/site-metadata'

const BASE = 'https://shop.example'

const pageData: ProductPageResponse = {
  breadcrumb: [],
  product: {
    id: 'prod-1',
    name: 'Red Shoes',
    slug: 'red-shoes',
    variantId: '2',
    slugByLocale: { 'en-US': 'red-shoes', 'de-DE': 'rote-schuhe' },
    description: '<p>Comfy &amp; red</p>',
    gallery: {
      images: [{ src: 'https://cdn.example/a.jpg', alt: 'Red shoes, side' }],
    },
  },
}

describe('buildProductPageMetadata', () => {
  it('builds a canonical without variantId and hreflang under the product prefix', () => {
    const metadata = buildProductPageMetadata({
      pageData,
      localePrefix: 'en',
      baseUrl: BASE,
    })
    expect(metadata.alternates).toEqual({
      canonical: `${BASE}/p/red-shoes`,
      languages: {
        'en-US': `${BASE}/p/red-shoes`,
        'de-DE': `${BASE}/de/p/rote-schuhe`,
        'x-default': `${BASE}/p/red-shoes`,
      },
    })
  })

  it('falls back to the product name, plain-text description and first image', () => {
    const metadata = buildProductPageMetadata({
      pageData,
      localePrefix: 'en',
      baseUrl: BASE,
    })
    expect(metadata.title).toBe('Red Shoes')
    expect(metadata.description).toBe('Comfy & red')
    expect(metadata.robots).toBeUndefined()
    expect(metadata.openGraph?.images).toEqual([
      { url: 'https://cdn.example/a.jpg', alt: 'Red shoes, side' },
    ])
  })

  it('prefers seo fields when present', () => {
    const metadata = buildProductPageMetadata({
      pageData: {
        ...pageData,
        seo: {
          metaTitle: 'Buy red shoes',
          metaDescription: 'Free shipping',
          ogImage: { url: 'https://cdn.example/og.jpg', alt: '' },
          noIndex: true,
        },
      },
      localePrefix: 'en',
      baseUrl: BASE,
    })
    expect(metadata.title).toBe('Buy red shoes')
    expect(metadata.description).toBe('Free shipping')
    expect(metadata.robots).toBe('noindex, nofollow')
    expect(metadata.twitter?.images).toEqual(['https://cdn.example/og.jpg'])
  })

  it('uses the default social image for a product without images', () => {
    const metadata = buildProductPageMetadata({
      pageData: {
        ...pageData,
        product: { ...pageData.product, gallery: { images: [] } },
      },
      localePrefix: 'en',
      baseUrl: BASE,
    })
    expect(metadata.openGraph?.images).toEqual([DEFAULT_OG_IMAGE])
  })

  it('emits no URLs without a site origin', () => {
    const metadata = buildProductPageMetadata({
      pageData,
      localePrefix: 'en',
      baseUrl: undefined,
    })
    expect(metadata.alternates).toEqual({})
    expect(metadata.title).toBe('Red Shoes')
  })
})
