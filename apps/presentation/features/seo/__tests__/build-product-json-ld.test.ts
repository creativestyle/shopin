/**
 * @jest-environment node
 */
import type { ProductDetailsResponse } from '@core/contracts/product/product-details'
import { JSONLD_MAX_IMAGES } from '@config/constants'
import { buildProductJsonLd } from '../build-product-json-ld'

const BASE = 'https://shop.example'
const URL = `${BASE}/p/red-shoes`

function makeProduct(
  overrides: Partial<ProductDetailsResponse> = {}
): ProductDetailsResponse {
  return {
    id: 'prod-1',
    name: 'Red Shoes',
    slug: 'red-shoes',
    description: '<p>Comfy &amp; red</p>',
    gallery: { images: [{ src: 'https://cdn.example/a.jpg', alt: 'A' }] },
    price: {
      regularPriceInCents: 12999,
      currency: 'EUR',
      fractionDigits: 2,
    },
    ...overrides,
  }
}

describe('buildProductJsonLd', () => {
  it('builds a Product node with an Offer at the regular price', () => {
    expect(
      buildProductJsonLd({ product: makeProduct(), url: URL, baseUrl: BASE })
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': URL,
      'url': URL,
      'name': 'Red Shoes',
      'productID': 'prod-1',
      'description': 'Comfy & red',
      'image': ['https://cdn.example/a.jpg'],
      'offers': {
        '@type': 'Offer',
        'price': '129.99',
        'priceCurrency': 'EUR',
        'url': URL,
      },
    })
  })

  it('uses the discounted price when present', () => {
    const product = makeProduct({
      price: {
        regularPriceInCents: 12999,
        discountedPriceInCents: 9999,
        currency: 'EUR',
      },
    })
    const jsonLd = buildProductJsonLd({ product, url: URL, baseUrl: BASE })
    expect(jsonLd.offers).toMatchObject({ price: '99.99' })
  })

  it('formats prices by the currency fraction digits', () => {
    const product = makeProduct({
      price: { regularPriceInCents: 1500, currency: 'JPY', fractionDigits: 0 },
    })
    const jsonLd = buildProductJsonLd({ product, url: URL, baseUrl: BASE })
    expect(jsonLd.offers).toMatchObject({ price: '1500' })
  })

  it('omits offers when the product has no price', () => {
    const product = makeProduct({ price: undefined })
    const jsonLd = buildProductJsonLd({ product, url: URL, baseUrl: BASE })
    expect(jsonLd).not.toHaveProperty('offers')
  })

  it('omits @id and url when the canonical URL is unknown', () => {
    const jsonLd = buildProductJsonLd({
      product: makeProduct(),
      url: undefined,
      baseUrl: undefined,
    })
    expect(jsonLd).not.toHaveProperty('@id')
    expect(jsonLd).not.toHaveProperty('url')
    expect(jsonLd.offers).not.toHaveProperty('url')
  })

  it('absolutizes root-relative images and drops relative ones', () => {
    const product = makeProduct({
      gallery: {
        images: [
          { src: 'https://cdn.example/a.jpg', alt: '' },
          { src: '/images/b.jpg', alt: '' },
          { src: 'c.jpg', alt: '' },
        ],
      },
    })
    expect(
      buildProductJsonLd({ product, url: URL, baseUrl: BASE }).image
    ).toEqual(['https://cdn.example/a.jpg', `${BASE}/images/b.jpg`])
    expect(
      buildProductJsonLd({ product, url: URL, baseUrl: undefined }).image
    ).toEqual(['https://cdn.example/a.jpg'])
  })

  it('caps the number of images', () => {
    const images = Array.from({ length: JSONLD_MAX_IMAGES + 5 }, (_, i) => ({
      src: `https://cdn.example/${i}.jpg`,
      alt: '',
    }))
    const jsonLd = buildProductJsonLd({
      product: makeProduct({ gallery: { images } }),
      url: URL,
      baseUrl: BASE,
    })
    expect(jsonLd.image).toHaveLength(JSONLD_MAX_IMAGES)
  })

  it('omits image and description when there are none', () => {
    const jsonLd = buildProductJsonLd({
      product: makeProduct({ description: '', gallery: { images: [] } }),
      url: URL,
      baseUrl: BASE,
    })
    expect(jsonLd).not.toHaveProperty('image')
    expect(jsonLd).not.toHaveProperty('description')
  })

  it('does not throw on malformed numeric entities in the description', () => {
    const product = makeProduct({ description: 'Bad &#99999999; entity' })
    expect(
      buildProductJsonLd({ product, url: URL, baseUrl: BASE }).description
    ).toBe('Bad &#99999999; entity')
  })
})
