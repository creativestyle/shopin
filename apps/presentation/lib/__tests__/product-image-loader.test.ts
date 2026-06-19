import { productImageLoader } from '../product-image-loader'

const CT_HOST = 'https://images.eu-central-1.aws.commercetools.com/project'

function load(src: string, width: number): string {
  const loader = productImageLoader(src)
  if (!loader) {
    throw new Error(`No loader returned for src: ${src}`)
  }
  return loader({ src, width })
}

describe('productImageLoader', () => {
  describe('host detection', () => {
    it('returns a loader for the CT CDN host', () => {
      expect(productImageLoader(`${CT_HOST}/image.jpg`)).toBeInstanceOf(
        Function
      )
    })

    it('returns undefined for a non-CT host', () => {
      expect(
        productImageLoader('https://storage.googleapis.com/bucket/image.jpg')
      ).toBeUndefined()
    })

    it('returns undefined for a relative path', () => {
      expect(productImageLoader('/images/product-image.png')).toBeUndefined()
    })

    it('returns undefined for an empty string', () => {
      expect(productImageLoader('')).toBeUndefined()
    })

    it('accepts protocol-relative CT URLs', () => {
      expect(
        productImageLoader(
          '//images.eu-central-1.aws.commercetools.com/project/image.jpg'
        )
      ).toBeInstanceOf(Function)
    })
  })

  describe('size suffix breakpoints', () => {
    const src = `${CT_HOST}/image.jpg`

    it('selects -thumb at width ≤ 50', () => {
      expect(load(src, 50)).toContain('-thumb')
      expect(load(src, 1)).toContain('-thumb')
    })

    it('selects -small at width ≤ 150', () => {
      expect(load(src, 150)).toContain('-small')
      expect(load(src, 51)).toContain('-small')
    })

    it('selects -medium at width ≤ 400', () => {
      expect(load(src, 400)).toContain('-medium')
      expect(load(src, 151)).toContain('-medium')
    })

    it('selects -large at width ≤ 700', () => {
      expect(load(src, 700)).toContain('-large')
      expect(load(src, 401)).toContain('-large')
    })

    it('selects -zoom at width > 700', () => {
      expect(load(src, 701)).toContain('-zoom')
      expect(load(src, 1400)).toContain('-zoom')
    })
  })

  describe('URL transformation', () => {
    const width = 700 // -large

    it('inserts suffix before the extension', () => {
      expect(load(`${CT_HOST}/image.jpg`, width)).toBe(
        `${CT_HOST}/image-large.jpg`
      )
    })

    it('preserves query string after the suffix', () => {
      expect(load(`${CT_HOST}/image.jpg?v=1`, width)).toBe(
        `${CT_HOST}/image-large.jpg?v=1`
      )
    })

    it('preserves a bare fragment (no query string)', () => {
      expect(load(`${CT_HOST}/image.jpg#anchor`, width)).toBe(
        `${CT_HOST}/image-large.jpg#anchor`
      )
    })

    it('preserves both query string and fragment', () => {
      expect(load(`${CT_HOST}/image.jpg?v=1#anchor`, width)).toBe(
        `${CT_HOST}/image-large.jpg?v=1#anchor`
      )
    })

    it('is a no-op for extensionless URLs', () => {
      const src = `${CT_HOST}/image`
      expect(load(src, width)).toBe(src)
    })

    it('handles .png extension', () => {
      expect(load(`${CT_HOST}/image.png`, width)).toBe(
        `${CT_HOST}/image-large.png`
      )
    })
  })
})
