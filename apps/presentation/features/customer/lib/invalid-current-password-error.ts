/**
 * Thrown when the BFF rejects the submitted current password (400 with
 * INVALID_CURRENT_PASSWORD). Surfaced as a field-level error on the form instead of the
 * generic error toast.
 * Message follows RateLimitError so HttpError.getStatusCode(error) still works.
 */
export class InvalidCurrentPasswordError extends Error {
  constructor(message = '400 Bad Request') {
    super(message)
    this.name = 'InvalidCurrentPasswordError'
  }
}
