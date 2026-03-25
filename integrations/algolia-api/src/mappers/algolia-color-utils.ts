import type { FacetTerm } from '@core/contracts/product-collection/facet'

const CSS_COLOR_PATTERN = /^(#[0-9a-f]{3,8}|rgb\(|hsl\()/i
const COLOR_PAIR_HEX_PATTERN = /[:=]\s*#[0-9a-f]{3,8}$/i
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
  if (COLOR_PAIR_HEX_PATTERN.test(term)) {
    return true
  }
  const sepMatch = term.match(/[:=]\s*(.+)$/)
  if (sepMatch?.[1] && isColorValue(sepMatch[1].trim())) {
    return true
  }
  return false
}

export function extractColorHex(term: string): string | undefined {
  const pairMatch = term.match(/[:=]\s*(#[0-9a-f]{3,8})$/i)
  if (pairMatch) {
    return pairMatch[1]
  }
  if (/^#[0-9a-f]{3,8}$/i.test(term)) {
    return term
  }
  const sepMatch = term.match(/[:=]\s*(.+)$/)
  if (sepMatch?.[1]) {
    const val = sepMatch[1].trim().toLowerCase()
    if (CSS_COLOR_KEYWORDS.has(val)) {
      return val
    }
  }
  return undefined
}

export function stripColorSuffix(label: string): string {
  const hexStripped = label.replace(/\s*[:=]\s*#[0-9a-f]{3,8}$/i, '').trim()
  if (hexStripped !== label) {
    return hexStripped
  }
  const sepMatch = label.match(/^(.*?)\s*[:=]\s*(.+)$/)
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
  if (terms.every((t) => isColorTerm(t.term))) {
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
