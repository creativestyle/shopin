/**
 * Thrown when the BFF rejects the submitted email because it already belongs to
 * another account (409). Surfaced as a field-level error on the form instead of the
 * generic error toast.
 */
export class DuplicateEmailError extends Error {
  constructor() {
    super('Email is already in use')
    this.name = 'DuplicateEmailError'
  }
}

export function isDuplicateEmailError(
  error: unknown
): error is DuplicateEmailError {
  return error instanceof DuplicateEmailError
}
