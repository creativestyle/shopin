import { HttpException, HttpStatus } from '@nestjs/common'
import { EMAIL_UNCHANGED_CODE } from '@core/contracts/customer/customer'

/**
 * The new email is the customer's current one (ignoring case), so nothing would change.
 */
export class EmailUnchangedException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Email is unchanged',
        code: EMAIL_UNCHANGED_CODE,
      },
      HttpStatus.BAD_REQUEST
    )
  }
}
