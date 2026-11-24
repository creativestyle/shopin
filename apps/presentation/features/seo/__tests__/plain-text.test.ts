/**
 * @jest-environment node
 */
import { buildMetaDescription } from '../plain-text'

describe('buildMetaDescription', () => {
  it('returns undefined for missing or blank input', () => {
    expect(buildMetaDescription(undefined)).toBeUndefined()
    expect(buildMetaDescription('')).toBeUndefined()
    expect(buildMetaDescription('<p> \n </p>')).toBeUndefined()
  })

  it('strips tags and collapses whitespace', () => {
    expect(buildMetaDescription('<p>Comfy</p>\n\n<b>red</b>   shoes')).toBe(
      'Comfy red shoes'
    )
  })

  it('decodes named, decimal and hex entities', () => {
    expect(
      buildMetaDescription('Black &amp; White&nbsp;&#169; &#xA9; &QUOT;x&quot;')
    ).toBe('Black & White © © "x"')
  })

  it('keeps unknown named entities as-is', () => {
    expect(buildMetaDescription('a &bogus; b')).toBe('a &bogus; b')
  })

  it('does not turn encoded markup back into stripped tags', () => {
    expect(buildMetaDescription('&lt;b&gt;bold&lt;/b&gt;')).toBe('<b>bold</b>')
  })

  it('keeps out-of-range numeric entities instead of throwing', () => {
    expect(buildMetaDescription('a &#99999999; b &#x110000; c')).toBe(
      'a &#99999999; b &#x110000; c'
    )
  })

  it('returns text at or under the limit unchanged', () => {
    expect(buildMetaDescription('one two', 7)).toBe('one two')
  })

  it('truncates on a word boundary with an ellipsis', () => {
    const result = buildMetaDescription('one two three four', 10)
    expect(result).toBe('one two…')
    expect(result!.length).toBeLessThanOrEqual(10)
  })

  it('hard-cuts a single long word', () => {
    expect(buildMetaDescription('a'.repeat(50), 10)).toBe(`${'a'.repeat(9)}…`)
  })
})
