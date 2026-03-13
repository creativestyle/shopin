/**
 * Validates a quantity value against min/max constraints
 * @param value - The value to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value (optional)
 * @returns The validated value clamped to min/max bounds
 */
export function validateQuantity(
  value: number,
  min: number,
  max?: number
): number {
  if (isNaN(value) || value < min) {
    return min
  }
  if (max !== undefined && value > max) {
    return max
  }
  return value
}
