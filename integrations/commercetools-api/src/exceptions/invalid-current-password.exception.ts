import { HttpException, HttpStatus } from '@nestjs/common'
import { INVALID_CURRENT_PASSWORD_CODE } from '@core/contracts/customer/customer'

/**
 * The submitted `currentPassword` does not match the customer's password.
 * A 400, not a 401: the session is valid, and a 401 would trigger token refresh and logout.
 */
export class InvalidCurrentPasswordException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid current password',
        code: INVALID_CURRENT_PASSWORD_CODE,
      },
      HttpStatus.BAD_REQUEST
    )
  }
}
