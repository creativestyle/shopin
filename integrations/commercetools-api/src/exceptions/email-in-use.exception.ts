import { HttpException, HttpStatus } from '@nestjs/common'
import { EMAIL_IN_USE_CODE } from '@core/contracts/customer/customer'

/**
 * The new email already belongs to another customer.
 */
export class EmailInUseException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message: 'Email is already in use',
        code: EMAIL_IN_USE_CODE,
      },
      HttpStatus.CONFLICT
    )
  }
}
