import type { ImageSource } from '@core/integration-kit'
import { imageSourceOf, resizeImage } from '../image-source'

const query: ImageSource = {
  hosts: ['images.ctfassets.net'],
  resize: { kind: 'query', width: 'w', quality: 'q', fixed: { fm: 'webp' } },
}
const widthOnly: ImageSource = {
  hosts: ['cdn.example.com'],
  resize: { kind: 'query', width: 'width' },
}
const suffix: ImageSource = {
  hosts: ['commercetools.com'],
  resize: {
    kind: 'suffix',
    steps: [
      { maxWidth: 150, suffix: '-small' },
      { maxWidth: 400, suffix: '-medium' },
    ],
    largest: '-large',
  },
}

describe('resizeImage (query)', () => {
  it('appends width, quality and the fixed params with ? to a URL without a query', () => {
    expect(
      resizeImage('https://images.ctfassets.net/a/b.jpg', 640, 75, query)
    ).toBe('https://images.ctfassets.net/a/b.jpg?w=640&q=75&fm=webp')
  })

  it('joins with & when the URL already has a query, keeping it', () => {
    expect(
      resizeImage('https://images.ctfassets.net/a/b.jpg?v=2', 640, 75, query)
    ).toBe('https://images.ctfassets.net/a/b.jpg?v=2&w=640&q=75&fm=webp')
  })

  it('rounds the width and sends no quality when the source has no quality param', () => {
    expect(
      resizeImage('https://cdn.example.com/x.png', 300.6, 75, widthOnly)
    ).toBe('https://cdn.example.com/x.png?width=301')
  })

  it('leaves the URL unchanged for a source without a resize rule', () => {
    expect(
      resizeImage('https://a.example/x.png', 640, 75, { hosts: ['a.example'] })
    ).toBe('https://a.example/x.png')
  })
})

describe('resizeImage (suffix)', () => {
  it('picks the first step that fits, else the largest, before the extension', () => {
    const src = 'https://commercetools.com/p/img.jpg'
    expect(resizeImage(src, 100, 75, suffix)).toBe(
      'https://commercetools.com/p/img-small.jpg'
    )
    expect(resizeImage(src, 400, 75, suffix)).toBe(
      'https://commercetools.com/p/img-medium.jpg'
    )
    expect(resizeImage(src, 1200, 75, suffix)).toBe(
      'https://commercetools.com/p/img-large.jpg'
    )
  })
})

describe('imageSourceOf', () => {
  const sources = [query, suffix]

  it('matches a host and its subdomains', () => {
    expect(imageSourceOf('https://images.ctfassets.net/a.jpg', sources)).toBe(
      query
    )
    expect(
      imageSourceOf(
        'https://images.eu-central-1.aws.commercetools.com/p/a.jpg',
        sources
      )
    ).toBe(suffix)
    expect(imageSourceOf('//images.ctfassets.net/a.jpg', sources)).toBe(query)
  })

  it('does not match a look-alike host that only ends with the same letters', () => {
    expect(
      imageSourceOf('https://evilcommercetools.com/a.jpg', sources)
    ).toBeUndefined()
    expect(
      imageSourceOf('https://images.ctfassets.net.evil.example/a.jpg', sources)
    ).toBeUndefined()
  })

  it('has no source for a relative path or an unknown host', () => {
    expect(imageSourceOf('/images/a.png', sources)).toBeUndefined()
    expect(
      imageSourceOf('https://other.example/a.png', sources)
    ).toBeUndefined()
  })
})
