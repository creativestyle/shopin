/**
 * @jest-environment node
 */
import {
  buildCanonicalUrl,
  buildHreflangLanguages,
  tryGetSiteBaseUrl,
} from '../site-url'

const BASE = 'https://shop.example'

describe('tryGetSiteBaseUrl', () => {
  const original = process.env.FRONTEND_URL

  afterEach(() => {
    if (original === undefined) {
      delete process.env.FRONTEND_URL
    } else {
      process.env.FRONTEND_URL = original
    }
  })

  it('returns undefined when FRONTEND_URL is unset or blank', () => {
    delete process.env.FRONTEND_URL
    expect(tryGetSiteBaseUrl()).toBeUndefined()
    process.env.FRONTEND_URL = '   '
    expect(tryGetSiteBaseUrl()).toBeUndefined()
  })

  it('trims whitespace and a trailing slash', () => {
    process.env.FRONTEND_URL = ' https://shop.example/ '
    expect(tryGetSiteBaseUrl()).toBe(BASE)
  })
})

describe('buildCanonicalUrl', () => {
  it('drops the default locale prefix', () => {
    expect(buildCanonicalUrl(BASE, 'en', 'about')).toBe(`${BASE}/about`)
  })

  it('keeps a non-default locale prefix', () => {
    expect(buildCanonicalUrl(BASE, 'de', 'about')).toBe(`${BASE}/de/about`)
  })

  it('returns the site root with a trailing slash for the default locale', () => {
    expect(buildCanonicalUrl(BASE, 'en')).toBe(`${BASE}/`)
    expect(buildCanonicalUrl(BASE, 'en', '')).toBe(`${BASE}/`)
  })

  it('returns the locale root for a non-default locale', () => {
    expect(buildCanonicalUrl(BASE, 'de')).toBe(`${BASE}/de`)
  })

  it('joins segments without doubled or trailing slashes', () => {
    expect(buildCanonicalUrl(`${BASE}/`, 'de', '/p/', '//rote-schuhe/')).toBe(
      `${BASE}/de/p/rote-schuhe`
    )
  })

  it('skips empty segments', () => {
    expect(buildCanonicalUrl(BASE, 'en', '', 'c', '', 'audio')).toBe(
      `${BASE}/c/audio`
    )
  })
})

describe('buildHreflangLanguages', () => {
  it('builds one URL per locale with localized slugs and a path prefix', () => {
    expect(
      buildHreflangLanguages(
        BASE,
        'red-shoes',
        { 'de-DE': 'rote-schuhe' },
        '/p'
      )
    ).toEqual({
      'en-US': `${BASE}/p/red-shoes`,
      'de-DE': `${BASE}/de/p/rote-schuhe`,
      'x-default': `${BASE}/p/red-shoes`,
    })
  })

  it('falls back to the shared slug for locales missing from slugByLocale', () => {
    expect(buildHreflangLanguages(BASE, 'about')).toEqual({
      'en-US': `${BASE}/about`,
      'de-DE': `${BASE}/de/about`,
      'x-default': `${BASE}/about`,
    })
  })

  it('points every locale at its root for an empty slug', () => {
    expect(buildHreflangLanguages(`${BASE}/`, '')).toEqual({
      'en-US': `${BASE}/`,
      'de-DE': `${BASE}/de`,
      'x-default': `${BASE}/`,
    })
  })
})
