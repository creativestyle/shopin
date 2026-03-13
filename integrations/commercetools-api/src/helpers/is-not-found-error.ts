/**
 * Type guard to check if an error has a statusCode property
 */
function hasStatusCode(error: unknown): error is { statusCode: number } {
  return (
    error !== null &&
    typeof error === 'object' &&
    'statusCode' in error &&
    typeof (error as { statusCode: unknown }).statusCode === 'number'
  )
}

/**
 * Checks if an error is a 404 Not Found error from Commercetools
 */
export function isNotFoundError(error: unknown): error is { statusCode: 404 } {
  return hasStatusCode(error) && error.statusCode === 404
}

/**
 * Checks if an error is a conflict error (400 or 409) from Commercetools
 * These typically indicate the cart was already converted to an order
 */
export function isConflictError(
  error: unknown
): error is { statusCode: 400 | 409 } {
  return (
    hasStatusCode(error) &&
    (error.statusCode === 400 || error.statusCode === 409)
  )
}
