/**
 * A shop page's title and description come from the page itself (Next's `metadata` or `generateMetadata` on the
 * component), as the render prefers the shop page over a CMS page of the same path. Over them: the canonical URL
 * and the hreflang alternates of the page's path, as CMS pages get them (SEO-001, SEO-003); the page's own win.
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
  delete process.env.FRONTEND_URL
})
afterAll(() => {
  delete process.env.FRONTEND_URL
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

  describe('canonical URL and hreflang alternates', () => {
    const deProps = (page: string[]) => ({
      params: Promise.resolve({ variant: 'v', locale: 'de', page }),
      searchParams: Promise.resolve({ q: '1' }),
    })
    beforeEach(() => {
      process.env.FRONTEND_URL = 'https://shop.example.com/'
    })

    it('a shop page gets the canonical URL of its path in this locale and the alternates in every locale', async () => {
      const Page = Object.assign(() => null, {
        metadata: { title: 'Firmenregister' },
      })
      mockFind.mockReturnValue({ Page, path: ['acme'] })
      await expect(
        generateMetadata(deProps(['company-register', 'acme']))
      ).resolves.toEqual({
        title: 'Firmenregister',
        alternates: {
          canonical: 'https://shop.example.com/de/company-register/acme',
          languages: {
            'en-US': 'https://shop.example.com/company-register/acme',
            'de-DE': 'https://shop.example.com/de/company-register/acme',
            'x-default': 'https://shop.example.com/company-register/acme',
          },
        },
      })
    })

    it("the page's own fields win, its own canonical included; the alternates it leaves out stay", async () => {
      const Page = Object.assign(() => null, {
        generateMetadata: async () => ({
          title: 'Register',
          alternates: { canonical: 'https://shop.example.com/register' },
        }),
      })
      mockFind.mockReturnValue({ Page, path: [] })
      const metadata = await generateMetadata(deProps(['company-register']))
      expect(metadata.title).toBe('Register')
      expect(metadata.alternates).toEqual({
        canonical: 'https://shop.example.com/register',
        languages: {
          'en-US': 'https://shop.example.com/company-register',
          'de-DE': 'https://shop.example.com/de/company-register',
          'x-default': 'https://shop.example.com/company-register',
        },
      })
    })
  })
})
