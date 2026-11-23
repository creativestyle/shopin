/**
 * Thrown when the BFF rejects the new email as taken (409 with EMAIL_IN_USE).
 * Surfaced as a field-level error on the form instead of the generic error toast.
 * Message follows RateLimitError so HttpError.getStatusCode(error) still works.
 */
export class EmailInUseError extends Error {
  constructor(message = '409 Conflict') {
    super(message)
    this.name = 'EmailInUseError'
  }
}
