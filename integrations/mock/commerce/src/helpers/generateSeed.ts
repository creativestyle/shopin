const FNV_OFFSET_BASIS = 0x811c9dc5
const FNV_PRIME = 0x01000193

/**
 * Generates a numeric seed from a string using 32-bit FNV-1a, so character order matters.
 *
 * @param text - The input string to generate the seed from.
 * @returns The numeric seed generated from the input string.
 */
export function generateSeed(text: string): number {
  let hash = FNV_OFFSET_BASIS
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, FNV_PRIME)
  }
  return hash >>> 0
}
