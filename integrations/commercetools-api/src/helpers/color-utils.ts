const CSS_COLOR_PATTERN = /^(#([0-9a-f]{3}|[0-9a-f]{6})|rgb\(|hsl\()/i
const COLOR_LABEL_WITH_CODE_PATTERN =
  /^\s*(.*?)\s*(?::|=)\s*(#(?:[0-9a-f]{3}|[0-9a-f]{6})|rgb\([^)]*\)|hsl\([^)]*\))\s*$/i

export function isCssColor(value: string): boolean {
  return CSS_COLOR_PATTERN.test(value)
}

export function parseColorPair(
  value: string
): { label: string; color: string } | null {
  const m = value.match(COLOR_LABEL_WITH_CODE_PATTERN)
  if (!m) {
    return null
  }
  return { label: m[1]!.trim(), color: m[2]!.trim() }
}

export function stripColorSuffix(value: string): string {
  const pair = parseColorPair(value)
  if (pair) {
    return pair.label
  }
  const colonIdx = value.lastIndexOf(':')
  return colonIdx === -1 ? value.trim() : value.slice(0, colonIdx).trim()
}

export function extractColorValue(value: string, fallback = '#888'): string {
  const pair = parseColorPair(value)
  if (pair) {
    return pair.color
  }
  const colonIdx = value.lastIndexOf(':')
  if (colonIdx === -1) {
    return fallback
  }
  const colorPart = value.slice(colonIdx + 1).trim()
  return colorPart || fallback
}
