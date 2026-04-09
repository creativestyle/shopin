import type { FacetTerm } from '@core/contracts/product-collection/facet'

/** Matches CSS color functions and hex prefixes: #abc, rgb(...), hsl(...) */
const CSS_COLOR_PATTERN = /^(#[0-9a-f]{3,8}|rgb\(|hsl\()/i

/** Matches a standalone hex color value exactly: #fff, #a1b2c3 */
const STANDALONE_HEX_PATTERN = /^#[0-9a-f]{3,8}$/i

/** Extracts the value after a key:value or key=value separator */
const PAIR_VALUE_PATTERN = /[:=]\s*(.+)$/

/** Extracts a hex color from a key:value or key=value pair */
const PAIR_HEX_PATTERN = /[:=]\s*(#[0-9a-f]{3,8})$/i

/** Matches a key:value separator followed by any color suffix (for stripping) */
const PAIR_SEPARATOR_PATTERN = /^(.*?)\s*[:=]\s*(.+)$/
const CSS_COLOR_KEYWORDS = new Set([
  'transparent',
  'currentcolor',
  'black',
  'white',
  'red',
  'green',
  'blue',
  'yellow',
  'orange',
  'purple',
  'gray',
  'grey',
  'pink',
  'brown',
  'cyan',
  'magenta',
  'lime',
  'olive',
  'navy',
  'teal',
  'aqua',
  'fuchsia',
  'maroon',
  'silver',
  'beige',
  'coral',
  'crimson',
  'gold',
  'indigo',
  'ivory',
  'khaki',
  'lavender',
  'linen',
  'plum',
  'salmon',
  'sienna',
  'tan',
  'tomato',
  'turquoise',
  'violet',
  'wheat',
])

const KNOWN_SIZES = new Set([
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  '2XL',
  '3XL',
  '4XL',
])
const SIZE_PATTERN = /^\d{1,3}$/

function isColorValue(value: string): boolean {
  return (
    CSS_COLOR_PATTERN.test(value) || CSS_COLOR_KEYWORDS.has(value.toLowerCase())
  )
}

function isColorTerm(term: string): boolean {
  if (isColorValue(term)) {
    return true
  }
  if (PAIR_HEX_PATTERN.test(term)) {
    return true
  }
  const sepMatch = term.match(PAIR_VALUE_PATTERN)
  if (sepMatch?.[1] && isColorValue(sepMatch[1].trim())) {
    return true
  }
  return false
}

export function extractColorHex(term: string): string | undefined {
  const pairMatch = term.match(PAIR_HEX_PATTERN)
  if (pairMatch) {
    return pairMatch[1]
  }
  if (STANDALONE_HEX_PATTERN.test(term)) {
    return term
  }
  const sepMatch = term.match(PAIR_VALUE_PATTERN)
  if (sepMatch?.[1]) {
    const val = sepMatch[1].trim().toLowerCase()
    if (CSS_COLOR_KEYWORDS.has(val)) {
      return val
    }
  }
  return undefined
}

export function stripColorSuffix(label: string): string {
  const hexStripped = label.replace(PAIR_HEX_PATTERN, '').trim()
  if (hexStripped !== label.trim()) {
    return hexStripped
  }
  const sepMatch = label.match(PAIR_SEPARATOR_PATTERN)
  if (sepMatch?.[1] && sepMatch[2]) {
    const val = sepMatch[2].trim().toLowerCase()
    if (CSS_COLOR_KEYWORDS.has(val)) {
      return sepMatch[1].trim()
    }
  }
  return label.trim()
}

export function inferDisplayType(
  terms: FacetTerm[]
): 'color' | 'size' | 'text' {
  if (terms.length > 0 && terms.every((t) => isColorTerm(t.term))) {
    return 'color'
  }
  if (
    terms.every(
      (t) => KNOWN_SIZES.has(t.term.toUpperCase()) || SIZE_PATTERN.test(t.term)
    )
  ) {
    return 'size'
  }
  return 'text'
}
