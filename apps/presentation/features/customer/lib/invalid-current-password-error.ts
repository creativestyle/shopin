import { INVALID_CURRENT_PASSWORD_CODE } from '@core/contracts/customer/customer'

/**
 * Thrown when the BFF rejects the submitted current password (401 with
 * INVALID_CURRENT_PASSWORD). Surfaced as a field-level error on the form instead of the
 * generic error toast.
 */
export class InvalidCurrentPasswordError extends Error {
  constructor() {
    super('Invalid current password')
    this.name = 'InvalidCurrentPasswordError'
  }
}

export function isInvalidCurrentPasswordError(
  error: unknown
): error is InvalidCurrentPasswordError {
  return error instanceof InvalidCurrentPasswordError
}

/**
 * Checks whether a 401 response is a wrong current password rather than an expired
 * session - both use 401 on the password endpoint.
 */
export async function hasInvalidCurrentPasswordCode(
  response: Response
): Promise<boolean> {
  try {
    const body = await response.json()
    return body?.code === INVALID_CURRENT_PASSWORD_CODE
  } catch {
    return false
  }
}
