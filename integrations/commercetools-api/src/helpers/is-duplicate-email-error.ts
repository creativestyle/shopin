interface CommercetoolsErrorBody {
  body?: {
    errors?: Array<{ code: string; field?: string }>
  }
}

/**
 * Checks if an error is Commercetools rejecting an email that is already taken.
 * Matches on the DuplicateField code: a bare 409 on the customer endpoint is a
 * ConcurrentModification, not a taken email.
 */
export function isDuplicateEmailError(error: unknown): boolean {
  if (error === null || typeof error !== 'object') {
    return false
  }

  const errors = (error as CommercetoolsErrorBody).body?.errors

  return (
    errors?.some((e) => e.code === 'DuplicateField' && e.field === 'email') ??
    false
  )
}
