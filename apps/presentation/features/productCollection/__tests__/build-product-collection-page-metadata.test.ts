/**
 * @jest-environment node
 */
import type { ProductCollectionPageResponse } from '@core/contracts/product-collection/product-collection-page'
import {
  buildProductCollectionPageMetadata,
  type BuildProductCollectionPageMetadataParams,
} from '../build-product-collection-page-metadata'

const BASE = 'https://shop.example'
const CATEGORY_URL = `${BASE}/c/audio`

const pageData: ProductCollectionPageResponse = {
  breadcrumb: [],
  productList: [],
  total: 120,
  categoryName: 'Audio',
  slugByLocale: { 'en-US': 'audio', 'de-DE': 'audio-de' },
}

function build(overrides: Partial<BuildProductCollectionPageMetadataParams>) {
  return buildProductCollectionPageMetadata({
    pageData,
    slug: 'audio',
    localePrefix: 'en',
    baseUrl: BASE,
    page: 1,
    totalPages: 5,
    hasRefinements: false,
    ...overrides,
  })
}

describe('buildProductCollectionPageMetadata', () => {
  it('indexes the clean first page with a self canonical and hreflang', () => {
    const metadata = build({})
    expect(metadata.robots).toBeUndefined()
    expect(metadata.title).toBe('Audio')
    expect(metadata.alternates).toEqual({
      canonical: CATEGORY_URL,
      languages: {
        'en-US': CATEGORY_URL,
        'de-DE': `${BASE}/de/c/audio-de`,
        'x-default': CATEGORY_URL,
      },
    })
  })

  it('gives paginated pages a self canonical with the page param and no hreflang', () => {
    const metadata = build({ page: 2, pageLabel: 'Page 2 of 5' })
    expect(metadata.robots).toBeUndefined()
    expect(metadata.title).toBe('Audio – Page 2 of 5')
    expect(metadata.alternates).toEqual({ canonical: `${CATEGORY_URL}?page=2` })
  })

  it('noindexes refined URLs and canonicalizes them to the clean category', () => {
    const metadata = build({ page: 2, hasRefinements: true })
    expect(metadata.robots).toBe('noindex, follow')
    expect(metadata.alternates).toEqual({ canonical: CATEGORY_URL })
  })

  it('noindexes out-of-range pages and canonicalizes them to page 1', () => {
    const metadata = build({ page: 9999 })
    expect(metadata.robots).toBe('noindex, follow')
    expect(metadata.alternates).toEqual({ canonical: CATEGORY_URL })
  })

  it('honours a CMS noIndex flag with nofollow', () => {
    const metadata = build({
      pageData: { ...pageData, seo: { noIndex: true } },
    })
    expect(metadata.robots).toBe('noindex, nofollow')
  })

  it('prefixes a non-default locale', () => {
    const metadata = build({ slug: 'audio-de', localePrefix: 'de' })
    expect(metadata.alternates?.canonical).toBe(`${BASE}/de/c/audio-de`)
  })

  it('prefers seo fields over the category name and default image', () => {
    const metadata = build({
      pageData: {
        ...pageData,
        seo: {
          metaTitle: 'Best audio',
          metaDescription: 'Speakers and headphones',
          ogImage: { url: 'https://cdn.example/og.jpg', alt: '' },
        },
      },
    })
    expect(metadata.title).toBe('Best audio')
    expect(metadata.description).toBe('Speakers and headphones')
    expect(metadata.openGraph?.images).toEqual([
      { url: 'https://cdn.example/og.jpg' },
    ])
  })

  it('falls back to the route slug without a category name', () => {
    const metadata = build({
      pageData: { ...pageData, categoryName: undefined },
    })
    expect(metadata.title).toBe('audio')
  })

  it('keeps robots rules but emits no URLs without a site origin', () => {
    const metadata = build({ baseUrl: undefined, hasRefinements: true })
    expect(metadata.robots).toBe('noindex, follow')
    expect(metadata.alternates).toEqual({})
  })
})
