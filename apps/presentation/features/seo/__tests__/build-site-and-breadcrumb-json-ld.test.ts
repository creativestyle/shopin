/**
 * @jest-environment node
 */
import { buildBreadcrumbJsonLd } from '../build-breadcrumb-json-ld'
import { buildSiteJsonLd } from '../build-site-json-ld'

const BASE = 'https://shop.example'
const CRUMBS = [
  { label: 'Audio', path: '/c/audio' },
  { label: 'Headphones', path: '/c/headphones' },
]

describe('buildBreadcrumbJsonLd', () => {
  it('returns undefined without a site origin or crumbs', () => {
    expect(
      buildBreadcrumbJsonLd({
        crumbs: CRUMBS,
        baseUrl: undefined,
        localePrefix: 'en',
      })
    ).toBeUndefined()
    expect(
      buildBreadcrumbJsonLd({ crumbs: [], baseUrl: BASE, localePrefix: 'en' })
    ).toBeUndefined()
  })

  it('prepends the home crumb and numbers items from 1', () => {
    const jsonLd = buildBreadcrumbJsonLd({
      crumbs: CRUMBS,
      baseUrl: BASE,
      localePrefix: 'en',
      homeLabel: 'Home',
    })
    expect(jsonLd?.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': `${BASE}/`,
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Audio',
        'item': `${BASE}/c/audio`,
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': 'Headphones',
        'item': `${BASE}/c/headphones`,
      },
    ])
  })

  it('prefixes item URLs with a non-default locale', () => {
    const jsonLd = buildBreadcrumbJsonLd({
      crumbs: CRUMBS.slice(0, 1),
      baseUrl: BASE,
      localePrefix: 'de',
      homeLabel: 'Startseite',
    })
    expect(
      (jsonLd?.itemListElement as Array<{ item: string }>).map((i) => i.item)
    ).toEqual([`${BASE}/de`, `${BASE}/de/c/audio`])
  })
})

describe('buildSiteJsonLd', () => {
  it('returns nothing without a site origin', () => {
    expect(buildSiteJsonLd({ baseUrl: undefined, localePrefix: 'en' })).toEqual(
      []
    )
  })

  it('builds Organization and WebSite nodes with a locale-aware search target', () => {
    const [organization, website] = buildSiteJsonLd({
      baseUrl: BASE,
      localePrefix: 'de',
    })
    expect(organization).toMatchObject({
      '@type': 'Organization',
      'url': `${BASE}/de`,
      'logo': `${BASE}/og-image.png`,
    })
    expect(website).toMatchObject({
      '@type': 'WebSite',
      'url': `${BASE}/de`,
      'potentialAction': {
        target: {
          urlTemplate: `${BASE}/de/search?q={search_term_string}`,
        },
      },
    })
  })
})
