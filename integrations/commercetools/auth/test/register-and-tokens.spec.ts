import { ConflictException } from '@nestjs/common'
import {
  CommercetoolsConfirmEmailService,
  CommercetoolsRegisterService,
  CommercetoolsResetPasswordService,
} from '../src/services'
import { CommercetoolsErrorMatcher } from '../src/utils/commercetools-error-matcher'
import { ConfirmEmailResponseSchema } from '@core/contracts/auth/confirm-email'
import { ResetPasswordResponseSchema } from '@core/contracts/auth/reset-password'

const REQUEST = {
  email: 'john@example.com',
  password: 'secret123',
  firstName: 'John',
  lastName: 'Doe',
  acceptTerms: true,
}

function createService(execute: jest.Mock) {
  const post = jest.fn().mockReturnValue({ execute })
  const client = { customers: () => ({ post }) }
  return new CommercetoolsRegisterService(client as never)
}

describe('CommercetoolsRegisterService.register', () => {
  it('maps DuplicateField on email to ConflictException', async () => {
    const service = createService(
      jest.fn().mockRejectedValue({
        statusCode: 400,
        body: { errors: [{ code: 'DuplicateField', field: 'email' }] },
      })
    )

    await expect(service.register(REQUEST)).rejects.toBeInstanceOf(
      ConflictException
    )
  })

  it('rethrows a bare 409 unchanged', async () => {
    const error = { statusCode: 409 }
    const service = createService(jest.fn().mockRejectedValue(error))

    await expect(service.register(REQUEST)).rejects.toBe(error)
  })
})

const TOKEN_NOT_FOUND = {
  statusCode: 404,
  body: { errors: [{ code: 'ResourceNotFound' }] },
}

describe('CommercetoolsErrorMatcher.isInvalidTokenError', () => {
  const matcher = new CommercetoolsErrorMatcher()

  it('matches 404 ResourceNotFound', () => {
    expect(matcher.isInvalidTokenError(TOKEN_NOT_FOUND)).toBe(true)
  })

  it('ignores 404 with another code or no body', () => {
    expect(
      matcher.isInvalidTokenError({
        statusCode: 404,
        body: { errors: [{ code: 'Other' }] },
      })
    ).toBe(false)
    expect(matcher.isInvalidTokenError({ statusCode: 404 })).toBe(false)
  })

  it('matches 400 InvalidToken', () => {
    expect(
      matcher.isInvalidTokenError({
        statusCode: 400,
        body: { errors: [{ code: 'InvalidToken' }] },
      })
    ).toBe(true)
  })

  it('ignores 400 ExpiredCustomerPasswordToken', () => {
    expect(
      matcher.isInvalidTokenError({
        statusCode: 400,
        body: { errors: [{ code: 'ExpiredCustomerPasswordToken' }] },
      })
    ).toBe(false)
  })
})

function createTokenServiceDeps(
  endpoint: 'emailConfirm' | 'passwordReset',
  execute: jest.Mock
) {
  const post = jest.fn().mockReturnValue({ execute })
  const client = { customers: () => ({ [endpoint]: () => ({ post }) }) }
  const serverClientService = { getClient: () => client }
  const logger = { setContext: jest.fn(), error: jest.fn() }
  return {
    args: [
      serverClientService as never,
      logger as never,
      new CommercetoolsErrorMatcher(),
    ] as const,
    logger,
  }
}

describe('CommercetoolsConfirmEmailService.confirmEmail', () => {
  it('maps a spent or unknown token to token_invalid without logging', async () => {
    const { args, logger } = createTokenServiceDeps(
      'emailConfirm',
      jest.fn().mockRejectedValue(TOKEN_NOT_FOUND)
    )
    const service = new CommercetoolsConfirmEmailService(...args)

    await expect(service.confirmEmail({ tokenValue: 'abc' })).resolves.toEqual({
      success: false,
      statusCode: 400,
      message: 'token_invalid',
    })
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('logs and returns a plain failure for unrelated errors', async () => {
    const { args, logger } = createTokenServiceDeps(
      'emailConfirm',
      jest.fn().mockRejectedValue(new Error('network'))
    )
    const service = new CommercetoolsConfirmEmailService(...args)

    await expect(service.confirmEmail({ tokenValue: 'abc' })).resolves.toEqual({
      success: false,
    })
    expect(logger.error).toHaveBeenCalled()
  })

  it('maps an expired email token to token_expired', async () => {
    const { args } = createTokenServiceDeps(
      'emailConfirm',
      jest.fn().mockRejectedValue({
        statusCode: 400,
        body: { errors: [{ code: 'ExpiredCustomerEmailToken' }] },
      })
    )
    const service = new CommercetoolsConfirmEmailService(...args)

    await expect(service.confirmEmail({ tokenValue: 'abc' })).resolves.toEqual({
      success: false,
      statusCode: 400,
      message: 'token_expired',
    })
  })
})

describe('CommercetoolsResetPasswordService.resetPassword', () => {
  it('maps a spent or unknown token to token_invalid without logging', async () => {
    const { args, logger } = createTokenServiceDeps(
      'passwordReset',
      jest.fn().mockRejectedValue(TOKEN_NOT_FOUND)
    )
    const service = new CommercetoolsResetPasswordService(...args)

    await expect(
      service.resetPassword({ tokenValue: 'abc', newPassword: 'secret123' })
    ).resolves.toEqual({
      success: false,
      statusCode: 400,
      message: 'token_invalid',
    })
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('maps an expired password token to token_expired', async () => {
    const { args } = createTokenServiceDeps(
      'passwordReset',
      jest.fn().mockRejectedValue({
        statusCode: 400,
        body: { errors: [{ code: 'ExpiredCustomerPasswordToken' }] },
      })
    )
    const service = new CommercetoolsResetPasswordService(...args)

    await expect(
      service.resetPassword({ tokenValue: 'abc', newPassword: 'secret123' })
    ).resolves.toEqual({
      success: false,
      statusCode: 400,
      message: 'token_expired',
    })
  })

  it('logs and returns a plain failure for unrelated errors', async () => {
    const { args, logger } = createTokenServiceDeps(
      'passwordReset',
      jest.fn().mockRejectedValue(new Error('network'))
    )
    const service = new CommercetoolsResetPasswordService(...args)

    await expect(
      service.resetPassword({ tokenValue: 'abc', newPassword: 'secret123' })
    ).resolves.toEqual({ success: false })
    expect(logger.error).toHaveBeenCalled()
  })
})

describe.each([
  ['ConfirmEmailResponseSchema', ConfirmEmailResponseSchema],
  ['ResetPasswordResponseSchema', ResetPasswordResponseSchema],
])('%s message', (_, schema) => {
  it.each(['token_expired', 'token_invalid'])('accepts %s', (message) => {
    expect(schema.safeParse({ success: false, message }).success).toBe(true)
  })

  it('rejects any other value', () => {
    expect(
      schema.safeParse({ success: false, message: 'token_used' }).success
    ).toBe(false)
  })
})
