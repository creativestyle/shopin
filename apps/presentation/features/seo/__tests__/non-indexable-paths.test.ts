/**
 * @jest-environment node
 */
import { isNonIndexablePath, stripLocalePrefix } from '../non-indexable-paths'

describe('stripLocalePrefix', () => {
  it('removes a leading locale prefix', () => {
    expect(stripLocalePrefix('/de/about')).toBe('/about')
    expect(stripLocalePrefix('/en/c/audio')).toBe('/c/audio')
  })

  it('normalizes a missing leading slash', () => {
    expect(stripLocalePrefix('de/about')).toBe('/about')
    expect(stripLocalePrefix('about')).toBe('/about')
  })

  it('maps a bare locale prefix to the root', () => {
    expect(stripLocalePrefix('/de')).toBe('/')
  })

  it('leaves segments that only start with a locale code unchanged', () => {
    expect(stripLocalePrefix('/design')).toBe('/design')
  })
})

describe('isNonIndexablePath', () => {
  it('matches a blocked route and its subtree, with or without locale', () => {
    expect(isNonIndexablePath('/checkout')).toBe(true)
    expect(isNonIndexablePath('/checkout/payment')).toBe(true)
    expect(isNonIndexablePath('/de/account/orders')).toBe(true)
  })

  it('does not match routes that merely share a prefix', () => {
    expect(isNonIndexablePath('/checkout-guide')).toBe(false)
  })

  it('does not match catalog, content or root paths', () => {
    expect(isNonIndexablePath('/c/audio')).toBe(false)
    expect(isNonIndexablePath('/about')).toBe(false)
    expect(isNonIndexablePath('/de')).toBe(false)
  })
})
