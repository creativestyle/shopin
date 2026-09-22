import { HttpException, HttpStatus } from '@nestjs/common'
import { INVALID_CURRENT_PASSWORD_CODE } from '@core/contracts/customer/customer'

/**
 * The submitted `currentPassword` does not match the customer's password.
 *
 * Deliberately not an `UnauthorizedException`: the session itself is valid, only the
 * submitted password is wrong. TokenRefreshInterceptor treats `UnauthorizedException`
 * (and any error carrying `statusCode: 401`) as an expired session, so it would refresh
 * the token, replay the password change with the same wrong password, and then clear the
 * customer's tokens - logging them out over a typo.
 *
 * The `code` in the body is what lets the client render a field-level error instead of
 * the generic "session expired" handling shared by other 401s.
 */
export class InvalidCurrentPasswordException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid current password',
        code: INVALID_CURRENT_PASSWORD_CODE,
      },
      HttpStatus.UNAUTHORIZED
    )
  }
}
