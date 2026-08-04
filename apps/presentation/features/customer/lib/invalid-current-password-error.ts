/**
 * Thrown when the BFF rejects the submitted current password (401 with
 * INVALID_CURRENT_PASSWORD). Surfaced as a field-level error on the form instead of the
 * generic error toast.
 * Message follows RateLimitError so HttpError.getStatusCode(error) still works.
 */
export class InvalidCurrentPasswordError extends Error {
  constructor(message = '401 Unauthorized') {
    super(message)
    this.name = 'InvalidCurrentPasswordError'
  }
}
