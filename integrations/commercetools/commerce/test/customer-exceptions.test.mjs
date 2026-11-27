import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { HttpStatus } from '@nestjs/common'
import contract from '@core/contracts/customer/customer'
import commerce from '../dist/index.js'

const {
  EMAIL_IN_USE_CODE,
  EMAIL_UNCHANGED_CODE,
  INVALID_CURRENT_PASSWORD_CODE,
} = contract
const {
  EmailInUseException,
  EmailUnchangedException,
  InvalidCurrentPasswordException,
} = commerce

// The BFF tells these errors apart only by the contract `code` in the response body (and the status), so each
// exception must carry them.
describe('customer exceptions carry the contract code the BFF reads', () => {
  for (const [name, error, status, code] of [
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
  ]) {
    it(name, () => {
      assert.equal(error.getStatus(), status)
      const response = error.getResponse()
      assert.equal(response.statusCode, status)
      assert.equal(response.code, code)
    })
  }
})
