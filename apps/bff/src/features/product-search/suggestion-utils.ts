/**
 * Extract query autocomplete suggestions from product names.
 * Generates progressively longer word phrases starting from the word
 * that matches the query prefix.
 */
export function extractQuerySuggestions(
  names: string[],
  query: string,
  limit: number = 10
): string[] {
  const lowerQuery = query.toLowerCase()
  const seen = new Set<string>()
  const suggestions: string[] = []

  for (const name of names) {
    const words = name.toLowerCase().split(/\s+/)
    const matchIdx = words.findIndex((w) => w.startsWith(lowerQuery))

    if (matchIdx >= 0) {
      for (let len = 1; len <= Math.min(3, words.length - matchIdx); len++) {
        const phrase = words.slice(matchIdx, matchIdx + len).join(' ')
        if (seen.has(phrase)) {
          continue
        }
        seen.add(phrase)
        suggestions.push(phrase)
        if (suggestions.length >= limit) {
          return suggestions
        }
      }
    }
  }

  return suggestions
}
