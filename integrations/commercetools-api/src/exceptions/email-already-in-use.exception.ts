import { HttpException, HttpStatus } from '@nestjs/common'
import { EMAIL_ALREADY_IN_USE_CODE } from '@core/contracts/customer/customer'

/**
 * The submitted email already belongs to another customer.
 *
 * A plain 409 is not enough on its own: Commercetools also answers 409 for
 * `ConcurrentModification` on the same endpoint, so the `code` in the body is what
 * lets the client tell a taken email apart from a version conflict.
 */
export class EmailAlreadyInUseException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message: 'Email is already in use',
        code: EMAIL_ALREADY_IN_USE_CODE,
      },
      HttpStatus.CONFLICT
    )
  }
}
