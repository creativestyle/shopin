import { META_DESCRIPTION_MAX_LENGTH } from './site-metadata'

/** Named/numeric entities common in CMS and catalog copy. */
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

/**
 * Decodes HTML entities so meta tags read as text rather than markup.
 * Without this, a catalog description containing "Black &amp; White" ends up in
 * the SERP snippet verbatim, ampersand escape included.
 */
function decodeEntities(value: string): string {
  return value.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    const token = String(entity)
    if (token.startsWith('#x') || token.startsWith('#X')) {
      const codePoint = parseInt(token.slice(2), 16)
      return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint)
    }
    if (token.startsWith('#')) {
      const codePoint = parseInt(token.slice(1), 10)
      return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint)
    }
    return NAMED_ENTITIES[token.toLowerCase()] ?? match
  })
}

/**
 * Strips HTML tags, decodes entities and collapses whitespace so catalog/CMS copy
 * is safe in a meta tag. Tags are removed before decoding, so an encoded "&lt;b&gt;"
 * cannot turn back into markup that a second pass would strip.
 */
export function toPlainText(value: string): string {
  return decodeEntities(value.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Plain-text description capped at `maxLength`, cut on a word boundary and
 * suffixed with an ellipsis. Returns undefined for empty input so callers can
 * fall back to the inherited site description instead of emitting an empty tag.
 */
export function buildMetaDescription(
  value: string | undefined,
  maxLength: number = META_DESCRIPTION_MAX_LENGTH
): string | undefined {
  const text = value ? toPlainText(value) : ''
  if (!text) {
    return undefined
  }
  if (text.length <= maxLength) {
    return text
  }
  const truncated = text.slice(0, Math.max(maxLength - 1, 1))
  const lastSpace = truncated.lastIndexOf(' ')
  return `${(lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trimEnd()}…`
}
