import { Injectable } from '@nestjs/common'

interface HttpError {
  statusCode: number
  body?: {
    errors?: Array<{ code: string; field?: string }>
    // OAuth error format (used by commercetools OAuth endpoints)
    error?: string
  }
}

@Injectable()
export class CommercetoolsErrorMatcher {
  private isHttpError(error: unknown): error is HttpError {
    if (error === null || typeof error !== 'object') {
      return false
    }
    return (
      'statusCode' in error &&
      typeof (error as HttpError).statusCode === 'number'
    )
  }

  isInvalidCredentialsError(error: unknown): boolean {
    if (!this.isHttpError(error)) {
      return false
    }

    // OAuth endpoints return 401 for invalid credentials
    if (error.statusCode === 401) {
      return true
    }

    // OAuth endpoints may also return 400 with invalid credentials errors
    if (error.statusCode === 400) {
      // Check for OAuth error format - invalid_grant or invalid_customer_account_credentials
      if (
        error.body?.error === 'invalid_grant' ||
        error.body?.error === 'invalid_customer_account_credentials'
      ) {
        return true
      }
    }

    return false
  }

  isInvalidTokenError(error: unknown): boolean {
    if (!this.isHttpError(error)) {
      return false
    }

    return (
      error.statusCode === 400 &&
      (error.body?.errors?.some((e) => e.code === 'InvalidToken') ?? false)
    )
  }

  isExpiredPasswordTokenError(error: unknown): boolean {
    if (!this.isHttpError(error)) {
      return false
    }

    return (
      error.statusCode === 400 &&
      (error.body?.errors?.some(
        (e) => e.code === 'ExpiredCustomerPasswordToken'
      ) ??
        false)
    )
  }

  isExpiredEmailTokenError(error: unknown): boolean {
    if (!this.isHttpError(error)) {
      return false
    }

    return (
      error.statusCode === 400 &&
      (error.body?.errors?.some(
        (e) => e.code === 'ExpiredCustomerEmailToken'
      ) ??
        false)
    )
  }

  isDuplicateEmailError(error: unknown): boolean {
    if (!this.isHttpError(error)) {
      return false
    }

    if (error.statusCode === 409) {
      return true
    }

    if (error.statusCode === 400) {
      return (
        error.body?.errors?.some(
          (e) => e.code === 'DuplicateField' && e.field === 'email'
        ) ?? false
      )
    }

    return false
  }
}
