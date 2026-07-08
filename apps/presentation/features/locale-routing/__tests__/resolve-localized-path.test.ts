/**
 * @jest-environment node
 */

jest.mock('react', () => ({ cache: <T>(fn: T) => fn }))
jest.mock('@config/constants', () => ({
  listLocales: jest.fn(),
  urlPrefixToRfc: jest.fn(),
}))
jest.mock('@/features/product/get-product-page', () => ({
  getProductPage: jest.fn(),
}))
jest.mock('@/features/productCollection/get-product-collection-page', () => ({
  getProductCollectionPage: jest.fn(),
}))
jest.mock('@/features/content/get-content-page', () => ({
  getContentPage: jest.fn(),
}))
jest.mock('@/features/content/homepage-slug', () => ({
  isHomepageSlug: jest.fn(),
}))
jest.mock('@/lib/variant/variant-key', () => ({
  decodeVariant: jest.fn(),
  isVariantSegment: jest.fn(),
}))

import { resolveLocalizedPath } from '../resolve-localized-path'
import { decodeVariant, isVariantSegment } from '@/lib/variant/variant-key'
import { getRequestVariant } from '@/lib/request-context/variant'
import { getProductPage } from '@/features/product/get-product-page'
import { getProductCollectionPage } from '@/features/productCollection/get-product-collection-page'
import { getContentPage } from '@/features/content/get-content-page'
import { isHomepageSlug } from '@/features/content/homepage-slug'

function mocks() {
  const config = jest.requireMock('@config/constants') as {
    listLocales: jest.Mock
    urlPrefixToRfc: jest.Mock
  }
  return {
    listLocales: config.listLocales,
    urlPrefixToRfc: config.urlPrefixToRfc,
    decodeVariant: jest.mocked(decodeVariant),
    isVariantSegment: jest.mocked(isVariantSegment),
    getProductPage: jest.mocked(getProductPage),
    getProductCollectionPage: jest.mocked(getProductCollectionPage),
    getContentPage: jest.mocked(getContentPage),
    isHomepageSlug: jest.mocked(isHomepageSlug),
  }
}

describe('resolveLocalizedPath', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const m = mocks()
    m.listLocales.mockReturnValue([
      { urlPrefix: 'en', language: 'en-US' },
      { urlPrefix: 'de', language: 'de-DE' },
    ])
    m.urlPrefixToRfc.mockImplementation((prefix: string) =>
      prefix === 'de' ? 'de-DE' : 'en-US'
    )
    m.isHomepageSlug.mockReturnValue(false)
    m.isVariantSegment.mockReturnValue(true)
  })

  it('sets variant context via ALS so getRequestVariant() reads it inside the loader when variantSegment is provided', async () => {
    const m = mocks()
    const decodedVariant = { dataSource: 'commercetools-algolia-set' }
    m.decodeVariant.mockReturnValue(decodedVariant)

    let capturedVariant: Record<string, string> | undefined
    m.getProductPage.mockImplementation(async () => {
      capturedVariant = getRequestVariant()
      return { product: { slugByLocale: { 'de-DE': 'produkt-slug' } } } as any
    })

    await resolveLocalizedPath({
      path: '/en/p/product-slug',
      targetUrlPrefix: 'de',
      variantSegment: '~commercetools-algolia-set',
    })

    expect(m.decodeVariant).toHaveBeenCalledWith('~commercetools-algolia-set')
    expect(capturedVariant).toEqual(decodedVariant)
  })

  it('getRequestVariant() is undefined inside the loader when variantSegment is null', async () => {
    const m = mocks()

    let capturedVariant: Record<string, string> | undefined = undefined
    m.getProductPage.mockImplementation(async () => {
      capturedVariant = getRequestVariant()
      return { product: { slugByLocale: { 'de-DE': 'produkt-slug' } } } as any
    })

    await resolveLocalizedPath({
      path: '/en/p/product-slug',
      targetUrlPrefix: 'de',
      variantSegment: null,
    })

    expect(m.decodeVariant).not.toHaveBeenCalled()
    expect(capturedVariant).toBeUndefined()
  })

  it('resolves product paths via getProductPage', async () => {
    const m = mocks()

    m.getProductPage.mockResolvedValue({
      product: { slugByLocale: { 'de-DE': 'produkt-slug' } },
    } as any)

    const result = await resolveLocalizedPath({
      path: '/en/p/product-slug',
      targetUrlPrefix: 'de',
      variantSegment: null,
    })

    expect(m.getProductPage).toHaveBeenCalledWith('product-slug')
    expect(result).toBe('/de/p/produkt-slug')
  })

  it('resolves collection paths via getProductCollectionPage', async () => {
    const m = mocks()

    m.getProductCollectionPage.mockResolvedValue({
      slugByLocale: { 'de-DE': 'kollektion' },
    } as any)

    const result = await resolveLocalizedPath({
      path: '/en/c/collection-slug',
      targetUrlPrefix: 'de',
      variantSegment: null,
    })

    expect(m.getProductCollectionPage).toHaveBeenCalledWith('collection-slug')
    expect(result).toBe('/de/c/kollektion')
  })

  it('resolves content paths via getContentPage', async () => {
    const m = mocks()

    m.getContentPage.mockResolvedValue({
      slugByLocale: { 'de-DE': 'ueber-uns' },
    } as any)

    const result = await resolveLocalizedPath({
      path: '/en/about-us',
      targetUrlPrefix: 'de',
      variantSegment: null,
    })

    expect(m.getContentPage).toHaveBeenCalledWith('about-us')
    expect(result).toBe('/de/ueber-uns')
  })

  it('returns fallback path when the loader throws', async () => {
    const m = mocks()
    m.getProductPage.mockRejectedValue(new Error('BFF error'))

    const result = await resolveLocalizedPath({
      path: '/en/p/broken-slug',
      targetUrlPrefix: 'de',
      variantSegment: null,
    })

    expect(result).toBe('/de/p/broken-slug')
  })

  it('returns fallback path when slugByLocale has no entry for target locale', async () => {
    const m = mocks()

    m.getProductPage.mockResolvedValue({ product: { slugByLocale: {} } } as any)

    const result = await resolveLocalizedPath({
      path: '/en/p/no-translation',
      targetUrlPrefix: 'de',
      variantSegment: null,
    })

    expect(result).toBe('/de/p/no-translation')
  })

  it('returns fallback without calling any loader when variantSegment is not a valid segment', async () => {
    const m = mocks()
    m.isVariantSegment.mockReturnValue(false)

    const result = await resolveLocalizedPath({
      path: '/en/p/product-slug',
      targetUrlPrefix: 'de',
      variantSegment: '~bogus',
    })

    expect(result).toBe('/de/p/product-slug')
    expect(m.getProductPage).not.toHaveBeenCalled()
    expect(m.decodeVariant).not.toHaveBeenCalled()
  })
})
