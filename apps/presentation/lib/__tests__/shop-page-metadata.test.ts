/**
 * A shop page's title and description come from the page itself (Next's `metadata` or `generateMetadata` on the
 * component), as the render prefers the shop page over a CMS page of the same path.
 */
const mockFind = jest.fn()
jest.mock('@/lib/shop-pages', () => ({
  findShopPage: (...a: unknown[]) => mockFind(...a),
  bffForPage: () => async () => ({}),
}))
jest.mock('@/lib/bff/core/bff-fetch-server', () => ({
  createBffFetchServer: async () => ({ fetch: jest.fn() }),
}))
const mockCms = jest.fn()
jest.mock('@/features/content/get-content-page', () => ({
  getContentPage: (...a: unknown[]) => mockCms(...a),
}))
jest.mock('@/lib/request-context/route-context', () => ({
  initRouteContext: () => undefined,
}))
jest.mock('@/features/content/content-page', () => ({
  ContentPage: () => null,
}))

import { generateMetadata } from '@/app/[variant]/[locale]/(main)/[...page]/page'

const props = (page: string[]) => ({
  params: Promise.resolve({ variant: 'v', locale: 'en-us', page }),
  searchParams: Promise.resolve({ q: '1' }),
})

beforeEach(() => {
  mockFind.mockReset()
  mockCms.mockReset()
})

describe('shop page metadata', () => {
  it('a static `metadata` on the shop page', async () => {
    const Page = Object.assign(() => null, {
      metadata: { title: 'Company register' },
    })
    mockFind.mockReturnValue({ Page, path: [] })
    await expect(
      generateMetadata(props(['company-register']))
    ).resolves.toEqual({
      title: 'Company register',
    })
    expect(mockCms).not.toHaveBeenCalled()
  })

  it('`generateMetadata` gets the props the page renders with', async () => {
    const generate = jest.fn(async (p: { path: string[]; locale: string }) => ({
      title: `Orders ${p.path.join('/')} (${p.locale})`,
    }))
    const Page = Object.assign(() => null, { generateMetadata: generate })
    mockFind.mockReturnValue({ Page, path: ['2024'] })
    await expect(generateMetadata(props(['orders', '2024']))).resolves.toEqual({
      title: 'Orders 2024 (en-us)',
    })
    expect(generate.mock.calls[0]![0]).toMatchObject({
      searchParams: { q: '1' },
    })
  })
})
