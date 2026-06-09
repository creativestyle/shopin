/**
 * @jest-environment node
 */
/**
 * variant-key.ts provides the pure encode/decode/resolve helpers that power the
 * data-source ISR cache partitioning strategy. The proxy rewrites every
 * incoming clean URL to /~<variantKey>/<locale>/…, and the proxy canonicalizes
 * any ~-segment back to the clean URL via 308.
 *
 * Correctness here is critical: a wrong encoding or a failed decode pins a
 * visitor to the wrong backend variant or breaks the ISR cache. Edge cases
 * (disallowed values, wrong part count) are exercised deliberately.
 */
import {
  resolveVariant,
  encodeVariant,
  decodeVariant,
  isVariantSegment,
  isDefaultVariantSegment,
  variantHeaders,
  variantHeadersFromSegment,
  getVariantSegmentFromPathname,
  DEFAULT_VARIANT_SEGMENT,
} from '../variant-key'

// Real constants — no mocking needed for pure functions.
const DEFAULT = 'commercetools-set'
const ALT = 'commercetools-algolia-set'
const COOKIE = 'data-source'
const HEADER = 'X-Data-Source'

// ─── resolveVariant ──────────────────────────────────────────────────────────

describe('resolveVariant', () => {
  it('uses the cookie value when it is in the allowed list', () => {
    const result = resolveVariant((name) => (name === COOKIE ? ALT : undefined))
    expect(result.dataSource).toBe(ALT)
  })

  it('falls back to defaultValue when cookie value is not allowed', () => {
    const result = resolveVariant((name) =>
      name === COOKIE ? 'bogus' : undefined
    )
    expect(result.dataSource).toBe(DEFAULT)
  })

  it('falls back to defaultValue when cookie is absent', () => {
    const result = resolveVariant(() => undefined)
    expect(result.dataSource).toBe(DEFAULT)
  })
})

// ─── encodeVariant ───────────────────────────────────────────────────────────

describe('encodeVariant', () => {
  it('encodes default resolved object with ~ prefix', () => {
    expect(encodeVariant({ dataSource: DEFAULT })).toBe(`~${DEFAULT}`)
  })

  it('encodes non-default resolved object', () => {
    expect(encodeVariant({ dataSource: ALT })).toBe(`~${ALT}`)
  })
})

// ─── decodeVariant ───────────────────────────────────────────────────────────

describe('decodeVariant', () => {
  it('decodes a valid ~ prefixed segment', () => {
    expect(decodeVariant(`~${DEFAULT}`)).toEqual({ dataSource: DEFAULT })
  })

  it('decodes without ~ prefix (lenient)', () => {
    expect(decodeVariant(DEFAULT)).toEqual({ dataSource: DEFAULT })
  })

  it('returns defaultValue when part value is not allowed', () => {
    expect(decodeVariant('~bogus')).toEqual({ dataSource: DEFAULT })
  })

  it('returns defaultValue when part count is wrong', () => {
    // With a single dimension, two parts separated by __ is too many
    expect(decodeVariant(`~${DEFAULT}__extra`)).toEqual({ dataSource: DEFAULT })
  })
})

// ─── isVariantSegment ────────────────────────────────────────────────────────

describe('isVariantSegment', () => {
  it('returns true for a valid default variant segment', () => {
    expect(isVariantSegment(`~${DEFAULT}`)).toBe(true)
  })

  it('returns false when ~ prefix is missing', () => {
    expect(isVariantSegment(DEFAULT)).toBe(false)
  })

  it('returns false when value is not in the allowed list', () => {
    expect(isVariantSegment('~bogus')).toBe(false)
  })

  it('returns false when part count is wrong (extra __ parts)', () => {
    // Registry has 1 dimension; two parts means wrong count
    expect(isVariantSegment(`~${DEFAULT}__extra`)).toBe(false)
  })
})

// ─── variantHeaders ──────────────────────────────────────────────────────────

describe('variantHeaders', () => {
  it('maps resolved dataSource to the X-Data-Source header', () => {
    expect(variantHeaders({ dataSource: DEFAULT })).toEqual({
      [HEADER]: DEFAULT,
    })
  })

  it('maps non-default resolved dataSource', () => {
    expect(variantHeaders({ dataSource: ALT })).toEqual({ [HEADER]: ALT })
  })
})

// ─── DEFAULT_VARIANT_SEGMENT ─────────────────────────────────────────────────

describe('DEFAULT_VARIANT_SEGMENT', () => {
  it('equals the encoded default data source', () => {
    expect(DEFAULT_VARIANT_SEGMENT).toBe(`~${DEFAULT}`)
  })
})

// ─── isDefaultVariantSegment ─────────────────────────────────────────────────
// Distinguishes the default segment (308-redirect to canonical clean URL) from
// a non-default segment (valid public alt-variant URL, pass through).

describe('isDefaultVariantSegment', () => {
  it('returns true for the default variant segment', () => {
    expect(isDefaultVariantSegment(`~${DEFAULT}`)).toBe(true)
  })

  it('returns false for a non-default variant segment', () => {
    expect(isDefaultVariantSegment(`~${ALT}`)).toBe(false)
  })

  it('returns false for an invalid variant segment (wrong value)', () => {
    expect(isDefaultVariantSegment('~bogus')).toBe(false)
  })

  it('returns false when ~ prefix is missing', () => {
    expect(isDefaultVariantSegment(DEFAULT)).toBe(false)
  })
})

// ─── variantHeadersFromSegment ───────────────────────────────────────────────
// Client BFF derives X-Data-Source from the URL segment instead of a cookie.

describe('variantHeadersFromSegment', () => {
  it('returns the correct header for the default segment', () => {
    expect(variantHeadersFromSegment(`~${DEFAULT}`)).toEqual({
      [HEADER]: DEFAULT,
    })
  })

  it('returns the correct header for the alt segment', () => {
    expect(variantHeadersFromSegment(`~${ALT}`)).toEqual({ [HEADER]: ALT })
  })

  it('falls back to the default when the segment is invalid', () => {
    // decodeVariant is lenient — invalid segment decodes to defaultValue
    expect(variantHeadersFromSegment('~bogus')).toEqual({ [HEADER]: DEFAULT })
  })
})

// ─── getVariantSegmentFromPathname ────────────────────────────────────────────
// Returns null for clean/default URLs (no prefix action needed) and the
// non-default segment for alt-variant URLs (used by the client BFF and locale switcher).

describe('getVariantSegmentFromPathname', () => {
  it('returns null for a clean default-locale URL (no variant prefix)', () => {
    expect(getVariantSegmentFromPathname('/en/foo')).toBeNull()
  })

  it('returns null for a root URL', () => {
    expect(getVariantSegmentFromPathname('/')).toBeNull()
  })

  it('returns null when the first segment is the DEFAULT variant segment', () => {
    // Default segment is canonical-only; clients stay on clean URLs
    expect(getVariantSegmentFromPathname(`/~${DEFAULT}/en/foo`)).toBeNull()
  })

  it('returns the alt segment for an alt-variant URL', () => {
    expect(getVariantSegmentFromPathname(`/~${ALT}/en/foo`)).toBe(`~${ALT}`)
  })

  it('returns null for a URL with an invalid ~ prefix (not a real variant segment)', () => {
    expect(getVariantSegmentFromPathname('/~bogus/en/foo')).toBeNull()
  })
})
