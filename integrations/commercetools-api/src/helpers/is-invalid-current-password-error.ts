import { hasStatusCode } from './is-not-found-error'

interface CommercetoolsErrorBody {
  body?: {
    errors?: Array<{ code: string }>
  }
}

/**
 * Checks if an error is Commercetools rejecting the submitted `currentPassword`.
 * Commercetools answers with 400 and an `InvalidCurrentPassword` error code.
 */
export function isInvalidCurrentPasswordError(error: unknown): boolean {
  if (!hasStatusCode(error) || error.statusCode !== 400) {
    return false
  }

  const errors = (error as CommercetoolsErrorBody).body?.errors

  return errors?.some((e) => e.code === 'InvalidCurrentPassword') ?? false
}
