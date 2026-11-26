/**
 * @jest-environment node
 */
/**
 * A real shop (one provider per category, no integration that declares variants) has no variant dimensions.
 * The proxy then rewrites every clean URL to the bare `~` segment, and the [variant] layout must accept it:
 * otherwise every page answers 404.
 */
const SINGLE = {
  labels: { only: 'Only' },
  productImages: [],
  contentImages: [],
  slots: {},
  variants: {
    dimensions: [],
    combinations: {
      '': {
        providers: { commerce: 'only' },
        unavailable: {},
        services: { wishlist: true },
      },
    },
  },
}

type VariantKey = typeof import('../variant-key')

function load(): VariantKey {
  let mod: VariantKey | undefined
  const before = process.env.SHOPIN_STOREFRONT
  process.env.SHOPIN_STOREFRONT = JSON.stringify(SINGLE)
  try {
    jest.isolateModules(() => {
      mod = require('../variant-key')
    })
  } finally {
    if (before === undefined) {
      delete process.env.SHOPIN_STOREFRONT
    } else {
      process.env.SHOPIN_STOREFRONT = before
    }
  }
  return mod!
}

describe('variant key without dimensions', () => {
  const v = load()

  it('encodes the default variant as the bare prefix', () => {
    expect(v.DEFAULT_VARIANT_SEGMENT).toBe('~')
  })

  it('accepts the bare prefix as a variant segment', () => {
    expect(v.isVariantSegment('~')).toBe(true)
  })

  it('rejects any value after the prefix', () => {
    expect(v.isVariantSegment('~only')).toBe(false)
    expect(v.isVariantSegment('~__')).toBe(false)
  })

  it('sends no provider headers', () => {
    expect(v.variantHeaders(v.decodeVariant('~'))).toEqual({})
  })
})
