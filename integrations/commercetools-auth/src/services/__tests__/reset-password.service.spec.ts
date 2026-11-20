import { CommercetoolsResetPasswordService } from '../reset-password.service'
import {
  createTokenServiceDeps,
  TOKEN_NOT_FOUND,
} from './token-service-test-utils'

const REQUEST = { tokenValue: 'abc', newPassword: 'secret123' }

function createService(execute: jest.Mock) {
  const { args, logger } = createTokenServiceDeps('passwordReset', execute)
  return { service: new CommercetoolsResetPasswordService(...args), logger }
}

describe('CommercetoolsResetPasswordService.resetPassword', () => {
  it('returns success when commercetools resets the password', async () => {
    const { service } = createService(jest.fn().mockResolvedValue({}))

    await expect(service.resetPassword(REQUEST)).resolves.toEqual({
      success: true,
    })
  })

  it('maps a spent or unknown token to token_invalid without logging', async () => {
    const { service, logger } = createService(
      jest.fn().mockRejectedValue(TOKEN_NOT_FOUND)
    )

    await expect(service.resetPassword(REQUEST)).resolves.toEqual({
      success: false,
      statusCode: 400,
      message: 'token_invalid',
    })
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('maps an expired password token to token_expired', async () => {
    const { service } = createService(
      jest.fn().mockRejectedValue({
        statusCode: 400,
        body: { errors: [{ code: 'ExpiredCustomerPasswordToken' }] },
      })
    )

    await expect(service.resetPassword(REQUEST)).resolves.toEqual({
      success: false,
      statusCode: 400,
      message: 'token_expired',
    })
  })

  it('logs and returns a plain failure for unrelated errors', async () => {
    const { service, logger } = createService(
      jest.fn().mockRejectedValue(new Error('network'))
    )

    await expect(service.resetPassword(REQUEST)).resolves.toEqual({
      success: false,
    })
    expect(logger.error).toHaveBeenCalled()
  })
})
