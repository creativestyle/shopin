interface CommercetoolsHttpError {
  statusCode: number
  body?: {
    errors?: Array<{ code: string }>
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
 * Checks if an error is Commercetools rejecting the submitted `currentPassword`.
 * Commercetools answers with 400 and an `InvalidCurrentPassword` error code.
 */
export function isInvalidCurrentPasswordError(error: unknown): boolean {
  if (!isCommercetoolsHttpError(error)) {
    return false
  }

  return (
    error.statusCode === 400 &&
    (error.body?.errors?.some((e) => e.code === 'InvalidCurrentPassword') ??
      false)
  )
}
