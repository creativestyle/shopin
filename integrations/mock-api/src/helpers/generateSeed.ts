/**
 * Generates a numeric seed value from a given string by summing the Unicode code points
 * of each character in the string.
 *
 * @param text - The input string to generate the seed from.
 * @returns The numeric seed generated from the input string.
 */
export function generateSeed(text: string): number {
  return Array.from(text).reduce((acc, char) => acc + char.charCodeAt(0), 0)
}
