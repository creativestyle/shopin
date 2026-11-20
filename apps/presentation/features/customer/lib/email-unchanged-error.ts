/**
 * Thrown when the BFF rejects the new email as the current one (400 with EMAIL_UNCHANGED).
 * Surfaced as a field-level error on the form instead of the generic error toast.
 * Message follows RateLimitError so HttpError.getStatusCode(error) still works.
 */
export class EmailUnchangedError extends Error {
  constructor(message = '400 Bad Request') {
    super(message)
    this.name = 'EmailUnchangedError'
  }
}
