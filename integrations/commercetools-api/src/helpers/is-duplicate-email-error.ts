interface CommercetoolsHttpError {
  statusCode: number
  body?: {
    errors?: Array<{ code: string; field?: string }>
  }
}

function isCommercetoolsHttpError(
  error: unknown
): error is CommercetoolsHttpError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'statusCode' in error &&
    typeof (error as CommercetoolsHttpError).statusCode === 'number'
  )
}

/**
 * Checks if an error is Commercetools rejecting an email that is already taken.
 * Matches on the `DuplicateField` code only - a bare 409 on the customer endpoint is
 * a `ConcurrentModification`, not a taken email.
 */
export function isDuplicateEmailError(error: unknown): boolean {
  if (!isCommercetoolsHttpError(error)) {
    return false
  }

  return (
    error.body?.errors?.some(
      (e) => e.code === 'DuplicateField' && e.field === 'email'
    ) ?? false
  )
}
