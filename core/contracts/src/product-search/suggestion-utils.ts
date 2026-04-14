/** Max number of extra words appended beyond the matched query to form suggestions. */
const MAX_EXTRA_SUGGESTION_WORDS = 2

/**
 * Extract query autocomplete suggestions from product names.
 * Generates progressively longer word phrases starting from the word
 * where the query begins. Supports multi-word queries (e.g. "red sh"
 * matches "red shirt" inside "cool red shirt").
 */
export function extractQuerySuggestions(
  names: string[],
  query: string,
  limit: number
): string[] {
  const lowerQuery = query.toLowerCase().trim()
  if (!lowerQuery) {
    return []
  }

  const queryWordCount = lowerQuery.split(/\s+/).length
  const seen = new Set<string>()
  const suggestions: string[] = []

  for (const name of names) {
    const lowerName = name.toLowerCase().trim()
    const words = lowerName.split(/\s+/)

    // Scan each word position to find where the query starts at a word boundary
    let matchWordIdx = -1
    for (let i = 0; i < words.length; i++) {
      const joined = words.slice(i).join(' ')
      if (joined.startsWith(lowerQuery)) {
        matchWordIdx = i
        break
      }
    }
    if (matchWordIdx < 0) {
      continue
    }

    // Generate phrases of increasing length, starting from at least
    // as many words as the query contains
    const maxLen = Math.min(
      queryWordCount + MAX_EXTRA_SUGGESTION_WORDS,
      words.length - matchWordIdx
    )
    for (let len = queryWordCount; len <= maxLen; len++) {
      const phrase = words.slice(matchWordIdx, matchWordIdx + len).join(' ')
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

  return suggestions
}
