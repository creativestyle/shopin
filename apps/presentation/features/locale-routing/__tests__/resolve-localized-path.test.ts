/**
 * @jest-environment node
 *
 * resolveLocalizedPath is the server action invoked by the client locale switcher.
 * It runs outside the [variant]/[locale] route tree, so getRequestVariant() would
 * otherwise be undefined and BFF calls would silently fall back to the default data
 * source — producing wrong localized slugs for alt-variant pages.
 *
 * The central invariant these tests protect:
 *   - When variantSegment is provided, setRequestVariantFromSegment is called BEFORE
 *     any loader, so BFF fetches inside those loaders use the correct data source.
 *   - When variantSegment is absent (default / clean URL), the setter is NOT called —
 *     the BFF default is correct.
 *   - Slug resolution correctly maps /p/, /c/, and content paths to the target locale.
 *   - On loader error, the fallback /<targetUrlPrefix><rest> path is returned.
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
jest.mock('@/lib/request-context/variant', () => ({
  setRequestVariantFromSegment: jest.fn(),
}))

import { resolveLocalizedPath } from '../resolve-localized-path'
import { setRequestVariantFromSegment } from '@/lib/request-context/variant'
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
    setRequestVariantFromSegment: jest.mocked(setRequestVariantFromSegment),
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
  })

  // The bug this test guards: on an alt-variant page the variant must be set before
  // any loader runs so BFF hits the correct data source.
  it('calls setRequestVariantFromSegment before any loader when variantSegment is provided', async () => {
    const m = mocks()
    const callOrder: string[] = []
    m.setRequestVariantFromSegment.mockImplementation(() => {
      callOrder.push('setVariant')
    })

    m.getProductPage.mockImplementation(async () => {
      callOrder.push('getProductPage')
      return { product: { slugByLocale: { 'de-DE': 'produkt-slug' } } } as any
    })

    await resolveLocalizedPath({
      path: '/en/p/product-slug',
      targetUrlPrefix: 'de',
      variantSegment: '~algolia__en',
    })

    expect(callOrder).toEqual(['setVariant', 'getProductPage'])
    expect(m.setRequestVariantFromSegment).toHaveBeenCalledWith('~algolia__en')
  })

  // Default / clean URL: variantSegment is null → BFF default is correct, setter must not fire.
  it('does not call setRequestVariantFromSegment when variantSegment is null', async () => {
    const m = mocks()

    m.getProductPage.mockResolvedValue({
      product: { slugByLocale: { 'de-DE': 'produkt-slug' } },
    } as any)

    await resolveLocalizedPath({
      path: '/en/p/product-slug',
      targetUrlPrefix: 'de',
      variantSegment: null,
    })

    expect(m.setRequestVariantFromSegment).not.toHaveBeenCalled()
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
})
