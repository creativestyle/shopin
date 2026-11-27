/**
 * @jest-environment jsdom
 */
/**
 * active-variant-client.ts provides getActiveVariantSegment() — a client-side
 * helper that returns the active variant segment from the URL (alt-variant ~ paths)
 * or falls back to reading the provider preference cookies (one per category).
 *
 * Used by useLocaleSwitcher and useBffFetchClient to derive the correct catalog
 * on clean-URL pages where the internal ~ rewrite is invisible to the browser.
 */
import { getActiveVariantSegment } from '../active-variant-client'
import { DEFAULT_VARIANT_SEGMENT } from '../variant-key'

import {
  ALT,
  ALT_COOKIE,
  DEFAULT,
  DEFAULT_RESOLVED,
  DIMS,
} from '../__fixtures__/variants'

// Fixtures derived from the project config (no provider named here).
const COOKIE = ALT_COOKIE.name
const DEFAULT_VALUE = DEFAULT_RESOLVED[DIMS[0]!.name]
const clearCookies = () => {
  for (const d of DIMS) {
    document.cookie = `${d.cookie}=; max-age=0; path=/`
  }
}

// ─── Path-first branch ───────────────────────────────────────────────────────

describe('getActiveVariantSegment — path-first branch', () => {
  it('returns the alt variant segment when pathname carries a ~ prefix', () => {
    expect(getActiveVariantSegment(`/${ALT}/en/p/shoes`)).toBe(ALT)
  })

  it('returns null for the default variant segment on a ~ URL (isDefaultVariantSegment)', () => {
    // Default variant URL: treated as "no active non-default variant".
    expect(getActiveVariantSegment(`/${DEFAULT}/en/p/shoes`)).toBeNull()
  })
})

// ─── Cookie fallback branch ──────────────────────────────────────────────────

describe('getActiveVariantSegment — cookie fallback branch', () => {
  afterEach(() => {
    // Clear any cookies set by tests
    clearCookies()
  })

  it('returns the alt segment when the provider cookie is set to an allowed alt value', () => {
    document.cookie = `${COOKIE}=${ALT_COOKIE.value}; path=/`
    expect(getActiveVariantSegment('/en/p/shoes')).toBe(ALT)
  })

  it('returns null when the provider cookie is set to the default value', () => {
    document.cookie = `${COOKIE}=${DEFAULT_VALUE}; path=/`
    expect(getActiveVariantSegment('/en/p/shoes')).toBeNull()
  })

  it('returns null when no provider cookie is set (resolves to default)', () => {
    // No cookie → resolveVariant defaults every dimension → DEFAULT_VARIANT_SEGMENT.
    expect(getActiveVariantSegment('/en/p/shoes')).toBeNull()
  })

  it('returns null when the provider cookie has a bogus/disallowed value', () => {
    document.cookie = `${COOKIE}=bogus-source; path=/`
    // resolveVariant falls back to default for disallowed values.
    expect(getActiveVariantSegment('/en/p/shoes')).toBeNull()
  })

  it('returns null for the root path with the default cookie', () => {
    document.cookie = `${COOKIE}=${DEFAULT_VALUE}; path=/`
    expect(getActiveVariantSegment('/')).toBeNull()
  })

  it('returns the alt segment for the root path with an alt cookie', () => {
    document.cookie = `${COOKIE}=${ALT_COOKIE.value}; path=/`
    expect(getActiveVariantSegment('/')).toBe(ALT)
  })
})

// ─── Path-first priority ─────────────────────────────────────────────────────

describe('getActiveVariantSegment — path takes precedence over cookie', () => {
  afterEach(() => {
    clearCookies()
  })

  it('returns path-derived alt segment even if cookie says default', () => {
    // The ~ path segment wins over the default cookie.
    document.cookie = `${COOKIE}=${DEFAULT_VALUE}; path=/`
    expect(getActiveVariantSegment(`/${ALT}/en/p/shoes`)).toBe(ALT)
  })

  it('falls through to cookie when path carries the DEFAULT_VARIANT_SEGMENT (treated as no alt)', () => {
    // The default variant segment means "no explicit alt" from the URL perspective;
    // the function treats it the same as a clean URL and falls back to the cookie.
    document.cookie = `${COOKIE}=${ALT_COOKIE.value}; path=/`
    expect(
      getActiveVariantSegment(`/${DEFAULT_VARIANT_SEGMENT}/en/p/shoes`)
    ).toBe(ALT)
  })
})
