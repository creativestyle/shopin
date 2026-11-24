/**
 * @jest-environment node
 */
import { buildExitHref } from '../draft-exit-href'

function parse(href: string) {
  const url = new URL(href, 'https://shop.example.com')
  return { pathname: url.pathname, params: url.searchParams }
}

describe('buildExitHref', () => {
  it('strips locale and preview segments, drops __pt and keeps other params', () => {
    const { pathname, params } = parse(
      buildExitHref('/de/preview/c/shoes', new URLSearchParams('page=2&__pt=x'))
    )
    expect(pathname).toBe('/api/draft/exit')
    expect(params.get('locale')).toBe('de')
    expect(params.get('slug')).toBe('c/shoes')
    expect(params.get('page')).toBe('2')
    expect(params.has('__pt')).toBe(false)
  })

  it('defaults the locale and empties the slug for a bare /preview', () => {
    const { params } = parse(buildExitHref('/preview', new URLSearchParams()))
    expect(params.get('locale')).toBe('en')
    expect(params.get('slug')).toBe('')
  })

  it('defaults the locale for an unprefixed clean path', () => {
    const { params } = parse(buildExitHref('/about-us', new URLSearchParams()))
    expect(params.get('locale')).toBe('en')
    expect(params.get('slug')).toBe('about-us')
  })

  it('keeps a first segment that is not a locale as part of the slug', () => {
    const { params } = parse(
      buildExitHref('/xx/about-us', new URLSearchParams())
    )
    expect(params.get('locale')).toBe('en')
    expect(params.get('slug')).toBe('xx/about-us')
  })
})
