/**
 * In a draft (preview) session the proxy funnels every non-app path into /preview; a shop page there must render,
 * not answer 404 (it has no CMS draft of its own).
 */
const mockFind = jest.fn()
jest.mock('@/lib/shop-pages', () => ({
  findShopPage: (...a: unknown[]) => mockFind(...a),
  bffForPage: () => async () => ({}),
}))
jest.mock('@/lib/bff/core/bff-fetch-server', () => ({
  createBffFetchServer: async () => ({ fetch: jest.fn() }),
}))
jest.mock('@/lib/draft-mode', () => ({ isPreviewTokenValid: () => true }))
jest.mock('@/lib/request-context/route-context', () => ({
  initRouteContext: () => undefined,
}))
const mockCms = jest.fn()
jest.mock('@/features/content/get-content-page', () => ({
  getContentPage: (...a: unknown[]) => mockCms(...a),
}))
jest.mock('@/features/content/content-page', () => ({
  ContentPage: () => null,
}))
jest.mock('@/features/product/product-page', () => ({
  ProductPage: () => null,
}))
jest.mock('@/features/productCollection/product-collection-page', () => ({
  ProductCollectionPage: () => null,
}))
jest.mock('next/headers', () => ({
  cookies: async () => ({ has: () => false }),
}))
jest.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
  redirect: () => {
    throw new Error('NEXT_REDIRECT')
  },
}))

import PreviewPage from '@/app/[variant]/[locale]/preview/[[...path]]/page'

const props = (path: string[]) => ({
  params: Promise.resolve({ variant: 'v', locale: 'en-us', path }),
  searchParams: Promise.resolve({ __preview: 'token' }),
})

it("a shop page renders in a draft session (the shop's page wins over a CMS slug)", async () => {
  function SetupPage() {
    return null
  }
  mockFind.mockReturnValue({ Page: SetupPage, path: [] })
  const element = (await PreviewPage(props(['setup']))) as {
    type: unknown
    props: { path: string[]; locale: string }
  }
  expect(element.type).toBe(SetupPage)
  expect(element.props).toMatchObject({ path: [], locale: 'en-us' })
  expect(mockCms).not.toHaveBeenCalled()
})

it('a path with no shop page is still a CMS slug', async () => {
  mockFind.mockReturnValue(undefined)
  mockCms.mockResolvedValue({})
  await PreviewPage(props(['about']))
  expect(mockCms).toHaveBeenCalledWith('about', true)
})
