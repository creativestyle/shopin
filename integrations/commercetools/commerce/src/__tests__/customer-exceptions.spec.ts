import { HttpException, HttpStatus } from '@nestjs/common'
import {
  EMAIL_IN_USE_CODE,
  EMAIL_UNCHANGED_CODE,
  INVALID_CURRENT_PASSWORD_CODE,
} from '@core/contracts/customer/customer'
import {
  EmailInUseException,
  EmailUnchangedException,
  InvalidCurrentPasswordException,
} from '..'

// The BFF tells these errors apart only by the contract `code` in the response body (and the status), so each
// exception must carry them.
describe('customer exceptions carry the contract code the BFF reads', () => {
  it.each([
    [
      'InvalidCurrentPasswordException',
      new InvalidCurrentPasswordException(),
      HttpStatus.BAD_REQUEST,
      INVALID_CURRENT_PASSWORD_CODE,
    ],
    [
      'EmailInUseException',
      new EmailInUseException(),
      HttpStatus.CONFLICT,
      EMAIL_IN_USE_CODE,
    ],
    [
      'EmailUnchangedException',
      new EmailUnchangedException(),
      HttpStatus.BAD_REQUEST,
      EMAIL_UNCHANGED_CODE,
    ],
  ])('%s', (_, error: HttpException, status, code) => {
    expect(error.getStatus()).toBe(status)
    expect(error.getResponse()).toMatchObject({ statusCode: status, code })
  })
})
