import { CommercetoolsConfirmEmailService } from '../confirm-email.service'
import {
  createTokenServiceDeps,
  TOKEN_NOT_FOUND,
} from './token-service-test-utils'

function createService(execute: jest.Mock) {
  const { args, logger } = createTokenServiceDeps('emailConfirm', execute)
  return { service: new CommercetoolsConfirmEmailService(...args), logger }
}

describe('CommercetoolsConfirmEmailService.confirmEmail', () => {
  it('returns success when commercetools confirms the token', async () => {
    const { service } = createService(jest.fn().mockResolvedValue({}))

    await expect(service.confirmEmail({ tokenValue: 'abc' })).resolves.toEqual({
      success: true,
    })
  })

  it('maps a spent or unknown token to token_invalid without logging', async () => {
    const { service, logger } = createService(
      jest.fn().mockRejectedValue(TOKEN_NOT_FOUND)
    )

    await expect(service.confirmEmail({ tokenValue: 'abc' })).resolves.toEqual({
      success: false,
      statusCode: 400,
      message: 'token_invalid',
    })
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('maps an expired email token to token_expired', async () => {
    const { service } = createService(
      jest.fn().mockRejectedValue({
        statusCode: 400,
        body: { errors: [{ code: 'ExpiredCustomerEmailToken' }] },
      })
    )

    await expect(service.confirmEmail({ tokenValue: 'abc' })).resolves.toEqual({
      success: false,
      statusCode: 400,
      message: 'token_expired',
    })
  })

  it('logs and returns a plain failure for unrelated errors', async () => {
    const { service, logger } = createService(
      jest.fn().mockRejectedValue(new Error('network'))
    )

    await expect(service.confirmEmail({ tokenValue: 'abc' })).resolves.toEqual({
      success: false,
    })
    expect(logger.error).toHaveBeenCalled()
  })
})
