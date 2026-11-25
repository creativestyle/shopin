/** The word of `words` within two edits of `word` (a typo's intended key), the nearest first. */
export function closest(
  word: string,
  words: readonly string[]
): string | undefined {
  const distance = (a: string, b: string) => {
    const row = [...Array(b.length + 1).keys()]
    for (let i = 1; i <= a.length; i++) {
      let prev = row[0]!
      row[0] = i
      for (let j = 1; j <= b.length; j++) {
        const was = row[j]!
        row[j] = Math.min(
          row[j]! + 1,
          row[j - 1]! + 1,
          prev + (a[i - 1] === b[j - 1] ? 0 : 1)
        )
        prev = was
      }
    }
    return row[b.length]!
  }
  return words
    .map((w) => [w, distance(word.toLowerCase(), w.toLowerCase())] as const)
    .filter(([, d]) => d <= 2)
    .sort((a, b) => a[1] - b[1])[0]?.[0]
}
