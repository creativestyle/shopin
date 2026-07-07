/**
 * @jest-environment jsdom
 */
/**
 * active-variant-client.ts provides getActiveVariantSegment() — a client-side
 * helper that returns the active variant segment from the URL (alt-variant ~ paths)
 * or falls back to reading the data-source preference cookie.
 *
 * Used by useLocaleSwitcher and useBffFetchClient to derive the correct catalog
 * on clean-URL pages where the internal ~ rewrite is invisible to the browser.
 */
import { getActiveVariantSegment } from '../active-variant-client'
import { DEFAULT_VARIANT_SEGMENT } from '../variant-key'

// Real constants from the registry (no mocking needed — pure function).
const DEFAULT = 'commercetools-set'
const ALT = 'commercetools-algolia-set'

// ─── Path-first branch ───────────────────────────────────────────────────────

describe('getActiveVariantSegment — path-first branch', () => {
  it('returns the alt variant segment when pathname carries a ~ prefix', () => {
    expect(getActiveVariantSegment(`/~${ALT}/en/p/shoes`)).toBe(`~${ALT}`)
  })

  it('returns null for the default variant segment on a ~ URL (isDefaultVariantSegment)', () => {
    // Default variant URL: treated as "no active non-default variant".
    expect(getActiveVariantSegment(`/~${DEFAULT}/en/p/shoes`)).toBeNull()
  })
})

// ─── Cookie fallback branch ──────────────────────────────────────────────────

describe('getActiveVariantSegment — cookie fallback branch', () => {
  afterEach(() => {
    // Clear any cookies set by tests
    document.cookie = 'data-source=; max-age=0; path=/'
  })

  it('returns the alt segment when the data-source cookie is set to an allowed alt value', () => {
    document.cookie = `data-source=${ALT}; path=/`
    expect(getActiveVariantSegment('/en/p/shoes')).toBe(`~${ALT}`)
  })

  it('returns null when the data-source cookie is set to the default value', () => {
    document.cookie = `data-source=${DEFAULT}; path=/`
    expect(getActiveVariantSegment('/en/p/shoes')).toBeNull()
  })

  it('returns null when no data-source cookie is set (resolves to default)', () => {
    // No cookie → resolveVariant defaults every dimension → DEFAULT_VARIANT_SEGMENT.
    expect(getActiveVariantSegment('/en/p/shoes')).toBeNull()
  })

  it('returns null when the data-source cookie has a bogus/disallowed value', () => {
    document.cookie = 'data-source=bogus-source; path=/'
    // resolveVariant falls back to default for disallowed values.
    expect(getActiveVariantSegment('/en/p/shoes')).toBeNull()
  })

  it('returns null for the root path with the default cookie', () => {
    document.cookie = `data-source=${DEFAULT}; path=/`
    expect(getActiveVariantSegment('/')).toBeNull()
  })

  it('returns the alt segment for the root path with an alt cookie', () => {
    document.cookie = `data-source=${ALT}; path=/`
    expect(getActiveVariantSegment('/')).toBe(`~${ALT}`)
  })
})

// ─── Path-first priority ─────────────────────────────────────────────────────

describe('getActiveVariantSegment — path takes precedence over cookie', () => {
  afterEach(() => {
    document.cookie = 'data-source=; max-age=0; path=/'
  })

  it('returns path-derived alt segment even if cookie says default', () => {
    // The ~ path segment wins over the default cookie.
    document.cookie = `data-source=${DEFAULT}; path=/`
    expect(getActiveVariantSegment(`/~${ALT}/en/p/shoes`)).toBe(`~${ALT}`)
  })

  it('falls through to cookie when path carries the DEFAULT_VARIANT_SEGMENT (treated as no alt)', () => {
    // The default variant segment means "no explicit alt" from the URL perspective;
    // the function treats it the same as a clean URL and falls back to the cookie.
    document.cookie = `data-source=${ALT}; path=/`
    expect(
      getActiveVariantSegment(`/${DEFAULT_VARIANT_SEGMENT}/en/p/shoes`)
    ).toBe(`~${ALT}`)
  })
})
