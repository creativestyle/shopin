/**
 * Format a price in cents to a decimal string (e.g. 1299 → "12.99").
 */
export function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2)
}

/**
 * Parse a dollar string back to cents (e.g. "12.99" → 1299).
 * Returns 0 for unparseable input.
 */
export function parsePriceInput(value: string): number {
  const parsed = parseFloat(value) * 100
  return isNaN(parsed) ? 0 : Math.round(parsed)
}
