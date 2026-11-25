import { hasStatusCode } from './has-status-code'

interface CommercetoolsErrorBody {
  body?: {
    errors?: Array<{ code: string }>
  }
}

/**
 * Checks if an error is Commercetools rejecting a sign-in with a wrong password.
 * Commercetools answers with 400 and an `InvalidCredentials` error code.
 */
export function isInvalidCredentialsError(error: unknown): boolean {
  if (!hasStatusCode(error) || error.statusCode !== 400) {
    return false
  }

  const errors = (error as CommercetoolsErrorBody).body?.errors

  return errors?.some((e) => e.code === 'InvalidCredentials') ?? false
}
