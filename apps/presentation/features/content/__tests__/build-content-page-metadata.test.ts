/**
 * @jest-environment node
 */
import type { ContentPageResponse } from '@core/contracts/content/page'
import { buildContentPageMetadata } from '../build-content-page-metadata'

const BASE = 'https://shop.example'

function makePage(
  overrides: Partial<ContentPageResponse>
): ContentPageResponse {
  return {
    breadcrumb: [],
    slug: 'about-us',
    slugByLocale: { 'en-US': 'about-us', 'de-DE': 'ueber-uns' },
    pageTitle: 'About us',
    components: [],
    ...overrides,
  }
}

describe('buildContentPageMetadata', () => {
  it('builds canonical and hreflang from localized slugs', () => {
    const metadata = buildContentPageMetadata({
      pageData: makePage({ slug: 'ueber-uns' }),
      localePrefix: 'de',
      baseUrl: BASE,
    })
    expect(metadata.alternates).toEqual({
      canonical: `${BASE}/de/ueber-uns`,
      languages: {
        'en-US': `${BASE}/about-us`,
        'de-DE': `${BASE}/de/ueber-uns`,
        'x-default': `${BASE}/about-us`,
      },
    })
  })

  it.each([
    ['homepage', 'en', `${BASE}/`],
    ['startseite', 'de', `${BASE}/de`],
  ])(
    'collapses the %s slug to the locale root',
    (slug, localePrefix, canonical) => {
      const metadata = buildContentPageMetadata({
        pageData: makePage({
          slug,
          slugByLocale: { 'en-US': 'homepage', 'de-DE': 'startseite' },
        }),
        localePrefix,
        baseUrl: BASE,
      })
      expect(metadata.alternates).toEqual({
        canonical,
        languages: {
          'en-US': `${BASE}/`,
          'de-DE': `${BASE}/de`,
          'x-default': `${BASE}/`,
        },
      })
    }
  )

  it('lets a CMS canonical override the derived one', () => {
    const metadata = buildContentPageMetadata({
      pageData: makePage({
        seo: { canonicalUrl: 'https://other.example/about' },
      }),
      localePrefix: 'en',
      baseUrl: BASE,
    })
    expect(metadata.alternates?.canonical).toBe('https://other.example/about')
    expect(metadata.openGraph?.url).toBe('https://other.example/about')
  })

  it('applies seo title, description and noIndex', () => {
    const metadata = buildContentPageMetadata({
      pageData: makePage({
        seo: {
          metaTitle: 'About SHOPin',
          metaDescription: 'Who we are',
          noIndex: true,
        },
      }),
      localePrefix: 'en',
      baseUrl: BASE,
    })
    expect(metadata.title).toBe('About SHOPin')
    expect(metadata.description).toBe('Who we are')
    expect(metadata.robots).toBe('noindex, nofollow')
  })

  it('emits no alternates without a site origin', () => {
    const metadata = buildContentPageMetadata({
      pageData: makePage({}),
      localePrefix: 'en',
      baseUrl: undefined,
    })
    expect(metadata.alternates).toBeUndefined()
    expect(metadata.title).toBe('About us')
  })
})
