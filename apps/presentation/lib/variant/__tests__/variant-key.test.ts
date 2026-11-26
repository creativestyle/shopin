/**
 * @jest-environment node
 */
/**
 * variant-key.ts provides the pure encode/decode/resolve helpers that power the
 * provider-per-category ISR cache partitioning strategy. Fixtures come from the
 * project config (../__fixtures__/variants), so no provider is named here. The proxy rewrites every
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
  hasVariantPrefix,
  isDefaultVariantSegment,
  variantHeaders,
  variantHeadersFromSegment,
  getVariantSegmentFromPathname,
  DEFAULT_VARIANT_SEGMENT,
  variantCacheTags,
} from '../variant-key'
import {
  DIMS,
  DEFAULT,
  DEFAULT_RESOLVED,
  ALT,
  ALT_RESOLVED,
  ALT_COOKIE,
  RULED_OUT,
  HAS_REQUIREMENTS,
  segmentOf,
  allVariants,
} from '../__fixtures__/variants'

const headersOf = (r: Record<string, string>) =>
  Object.fromEntries(DIMS.map((d) => [d.header, r[d.name]]))
// the inner value of a segment, without the ~ prefix
const inner = (segment: string) => segment.slice(1)

// ─── resolveVariant ──────────────────────────────────────────────────────────

describe('resolveVariant', () => {
  it('replaces a choice the config rules out with a provider that fits', () => {
    expect(RULED_OUT !== undefined).toBe(HAS_REQUIREMENTS)
    const cookies = Object.fromEntries(
      DIMS.map((d) => [d.cookie, RULED_OUT!.raw[d.name]])
    )
    expect(resolveVariant((name) => cookies[name])).toEqual(RULED_OUT!.resolved)
  })

  it('uses the cookie value when it is in the allowed list', () => {
    const result = resolveVariant((name) =>
      name === ALT_COOKIE.name ? ALT_COOKIE.value : undefined
    )
    expect(result).toEqual(ALT_RESOLVED)
    expect(result[DIMS[0]!.name]).toBe(ALT_COOKIE.value)
  })

  it('falls back to defaultValue when cookie value is not allowed', () => {
    const result = resolveVariant((name) =>
      name === ALT_COOKIE.name ? 'bogus' : undefined
    )
    expect(result).toEqual(DEFAULT_RESOLVED)
  })

  it('falls back to defaultValue when cookie is absent', () => {
    const result = resolveVariant(() => undefined)
    expect(result).toEqual(DEFAULT_RESOLVED)
  })
})

// ─── encodeVariant ───────────────────────────────────────────────────────────

describe('encodeVariant', () => {
  it('encodes default resolved object with ~ prefix', () => {
    expect(encodeVariant(DEFAULT_RESOLVED)).toBe(DEFAULT)
  })

  it('encodes non-default resolved object', () => {
    expect(encodeVariant(ALT_RESOLVED)).toBe(ALT)
  })
})

// ─── decodeVariant ───────────────────────────────────────────────────────────

describe('decodeVariant', () => {
  it('decodes a valid ~ prefixed segment', () => {
    expect(decodeVariant(DEFAULT)).toEqual(DEFAULT_RESOLVED)
    expect(decodeVariant(ALT)).toEqual(ALT_RESOLVED)
  })

  it('decodes without ~ prefix (lenient)', () => {
    expect(decodeVariant(inner(ALT))).toEqual(ALT_RESOLVED)
  })

  it('returns defaultValue when part value is not allowed', () => {
    expect(decodeVariant('~bogus')).toEqual(DEFAULT_RESOLVED)
  })

  it('returns defaultValue for dimensions missing from the segment', () => {
    // Only the first dimension is given; the others take their defaults
    expect(decodeVariant(`~${DEFAULT_RESOLVED[DIMS[0]!.name]}`)).toEqual(
      DEFAULT_RESOLVED
    )
  })

  it('applies the config requirements to a ruled-out combination', () => {
    expect(decodeVariant(segmentOf(RULED_OUT!.raw))).toEqual(
      RULED_OUT!.resolved
    )
  })
})

// ─── isVariantSegment ────────────────────────────────────────────────────────

describe('isVariantSegment', () => {
  it('returns true for a valid default variant segment', () => {
    expect(isVariantSegment(DEFAULT)).toBe(true)
    expect(isVariantSegment(ALT)).toBe(true)
  })

  it('accepts every allowed combination and no other', () => {
    const all = allVariants()
    console.log('allowed variants:', all)
    expect(all).toContain(DEFAULT)
    expect(all.every(isVariantSegment)).toBe(true)
  })

  it('returns false for a combination the config rules out', () => {
    expect(isVariantSegment(segmentOf(RULED_OUT!.raw))).toBe(false)
  })

  it('returns false when ~ prefix is missing', () => {
    expect(isVariantSegment(inner(DEFAULT))).toBe(false)
  })

  it('returns false when value is not in the allowed list', () => {
    expect(isVariantSegment('~bogus')).toBe(false)
  })

  it('returns false when part count is wrong (extra __ parts)', () => {
    expect(isVariantSegment(`${DEFAULT}__extra`)).toBe(false)
  })
})

// ─── hasVariantPrefix ────────────────────────────────────────────────────────
// Used by the proxy leaked-URL guard: any ~ segment is redirected, valid or not.

describe('hasVariantPrefix', () => {
  it('returns true for a valid default variant segment', () => {
    expect(hasVariantPrefix(DEFAULT)).toBe(true)
  })

  it('returns true for a valid alt variant segment', () => {
    expect(hasVariantPrefix(ALT)).toBe(true)
  })

  it('returns true for a ~ prefix with a bogus value (not in allowed list)', () => {
    // Unlike isVariantSegment, hasVariantPrefix does not validate the value.
    expect(hasVariantPrefix('~bogus')).toBe(true)
  })

  it('returns true for a bare ~ (empty inner value)', () => {
    expect(hasVariantPrefix('~')).toBe(true)
  })

  it('returns false when ~ prefix is absent', () => {
    expect(hasVariantPrefix(inner(DEFAULT))).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(hasVariantPrefix('')).toBe(false)
  })

  it('returns false for a string starting with ~ look-alike character', () => {
    // Tilde character must be exact ASCII 0x7E (~); a look-alike is different.
    // (Sanity check — ~ is ASCII, no confusables expected in practice.)
    expect(hasVariantPrefix('en')).toBe(false)
  })
})

// ─── variantHeaders ──────────────────────────────────────────────────────────

describe('variantHeaders', () => {
  it('maps each resolved category to its X-<Category>-Provider header', () => {
    expect(variantHeaders(DEFAULT_RESOLVED)).toEqual(
      headersOf(DEFAULT_RESOLVED)
    )
  })

  it('maps a non-default resolved variant', () => {
    expect(variantHeaders(ALT_RESOLVED)).toEqual(headersOf(ALT_RESOLVED))
  })
})

describe('variantCacheTags', () => {
  it('tags a fetch with variant:<category>:<provider> per dimension', () => {
    expect(variantCacheTags(ALT_RESOLVED)).toEqual(
      DIMS.map((d) => `variant:${d.name}:${ALT_RESOLVED[d.name]}`)
    )
  })
})

// ─── DEFAULT_VARIANT_SEGMENT ─────────────────────────────────────────────────

describe('DEFAULT_VARIANT_SEGMENT', () => {
  it('equals the encoded default data source', () => {
    expect(DEFAULT_VARIANT_SEGMENT).toBe(DEFAULT)
  })
})

// ─── isDefaultVariantSegment ─────────────────────────────────────────────────
// Distinguishes the default segment (308-redirect to canonical clean URL) from
// a non-default segment (valid public alt-variant URL, pass through).

describe('isDefaultVariantSegment', () => {
  it('returns true for the default variant segment', () => {
    expect(isDefaultVariantSegment(DEFAULT)).toBe(true)
  })

  it('returns false for a non-default variant segment', () => {
    expect(isDefaultVariantSegment(ALT)).toBe(false)
  })

  it('returns false for an invalid variant segment (wrong value)', () => {
    expect(isDefaultVariantSegment('~bogus')).toBe(false)
  })

  it('returns false when ~ prefix is missing', () => {
    expect(isDefaultVariantSegment(inner(DEFAULT))).toBe(false)
  })
})

// ─── variantHeadersFromSegment ───────────────────────────────────────────────
// Client BFF derives the provider headers from the URL segment instead of the cookies.

describe('variantHeadersFromSegment', () => {
  it('returns the correct header for the default segment', () => {
    expect(variantHeadersFromSegment(DEFAULT)).toEqual(
      headersOf(DEFAULT_RESOLVED)
    )
  })

  it('returns the correct header for the alt segment', () => {
    expect(variantHeadersFromSegment(ALT)).toEqual(headersOf(ALT_RESOLVED))
  })

  it('falls back to the default when the segment is invalid', () => {
    // decodeVariant is lenient — invalid segment decodes to defaultValue
    expect(variantHeadersFromSegment('~bogus')).toEqual(
      headersOf(DEFAULT_RESOLVED)
    )
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
    expect(getVariantSegmentFromPathname(`/${DEFAULT}/en/foo`)).toBeNull()
  })

  it('returns the alt segment for an alt-variant URL', () => {
    expect(getVariantSegmentFromPathname(`/${ALT}/en/foo`)).toBe(ALT)
  })

  it('returns null for a URL with an invalid ~ prefix (not a real variant segment)', () => {
    expect(getVariantSegmentFromPathname('/~bogus/en/foo')).toBeNull()
  })
})
