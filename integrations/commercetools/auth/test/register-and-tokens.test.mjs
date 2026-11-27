import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { ConflictException } from '@nestjs/common'
import services from '../dist/services/index.js'
import errorMatcher from '../dist/utils/commercetools-error-matcher.js'
import confirmEmail from '@core/contracts/auth/confirm-email'
import resetPassword from '@core/contracts/auth/reset-password'

const {
  CommercetoolsConfirmEmailService,
  CommercetoolsRegisterService,
  CommercetoolsResetPasswordService,
} = services
const { CommercetoolsErrorMatcher } = errorMatcher
const { ConfirmEmailResponseSchema } = confirmEmail
const { ResetPasswordResponseSchema } = resetPassword

/** A mock function whose every call rejects with `error`. */
const rejecting = (error) =>
  mock.fn(async () => {
    throw error
  })

const REQUEST = {
  email: 'john@example.com',
  password: 'secret123',
  firstName: 'John',
  lastName: 'Doe',
  acceptTerms: true,
}

function createService(execute) {
  const post = mock.fn(() => ({ execute }))
  const client = { customers: () => ({ post }) }
  return new CommercetoolsRegisterService(client)
}

describe('CommercetoolsRegisterService.register', () => {
  it('maps DuplicateField on email to ConflictException', async () => {
    const service = createService(
      rejecting({
        statusCode: 400,
        body: { errors: [{ code: 'DuplicateField', field: 'email' }] },
      })
    )

    await assert.rejects(service.register(REQUEST), ConflictException)
  })

  it('rethrows a bare 409 unchanged', async () => {
    const error = { statusCode: 409 }
    const service = createService(rejecting(error))

    await assert.rejects(service.register(REQUEST), (e) => {
      assert.equal(e, error)
      return true
    })
  })
})

const TOKEN_NOT_FOUND = {
  statusCode: 404,
  body: { errors: [{ code: 'ResourceNotFound' }] },
}

describe('CommercetoolsErrorMatcher.isInvalidTokenError', () => {
  const matcher = new CommercetoolsErrorMatcher()

  it('matches 404 ResourceNotFound', () => {
    assert.equal(matcher.isInvalidTokenError(TOKEN_NOT_FOUND), true)
  })

  it('ignores 404 with another code or no body', () => {
    assert.equal(
      matcher.isInvalidTokenError({
        statusCode: 404,
        body: { errors: [{ code: 'Other' }] },
      }),
      false
    )
    assert.equal(matcher.isInvalidTokenError({ statusCode: 404 }), false)
  })

  it('matches 400 InvalidToken', () => {
    assert.equal(
      matcher.isInvalidTokenError({
        statusCode: 400,
        body: { errors: [{ code: 'InvalidToken' }] },
      }),
      true
    )
  })

  it('ignores 400 ExpiredCustomerPasswordToken', () => {
    assert.equal(
      matcher.isInvalidTokenError({
        statusCode: 400,
        body: { errors: [{ code: 'ExpiredCustomerPasswordToken' }] },
      }),
      false
    )
  })
})

function createTokenServiceDeps(endpoint, execute) {
  const post = mock.fn(() => ({ execute }))
  const client = { customers: () => ({ [endpoint]: () => ({ post }) }) }
  const serverClientService = { getClient: () => client }
  const logger = { setContext: mock.fn(), error: mock.fn() }
  return {
    args: [serverClientService, logger, new CommercetoolsErrorMatcher()],
    logger,
  }
}

describe('CommercetoolsConfirmEmailService.confirmEmail', () => {
  it('maps a spent or unknown token to token_invalid without logging', async () => {
    const { args, logger } = createTokenServiceDeps(
      'emailConfirm',
      rejecting(TOKEN_NOT_FOUND)
    )
    const service = new CommercetoolsConfirmEmailService(...args)

    assert.deepEqual(await service.confirmEmail({ tokenValue: 'abc' }), {
      success: false,
      statusCode: 400,
      message: 'token_invalid',
    })
    assert.equal(logger.error.mock.callCount(), 0)
  })

  it('logs and returns a plain failure for unrelated errors', async () => {
    const { args, logger } = createTokenServiceDeps(
      'emailConfirm',
      rejecting(new Error('network'))
    )
    const service = new CommercetoolsConfirmEmailService(...args)

    assert.deepEqual(await service.confirmEmail({ tokenValue: 'abc' }), {
      success: false,
    })
    assert.ok(logger.error.mock.callCount() > 0)
  })

  it('maps an expired email token to token_expired', async () => {
    const { args } = createTokenServiceDeps(
      'emailConfirm',
      rejecting({
        statusCode: 400,
        body: { errors: [{ code: 'ExpiredCustomerEmailToken' }] },
      })
    )
    const service = new CommercetoolsConfirmEmailService(...args)

    assert.deepEqual(await service.confirmEmail({ tokenValue: 'abc' }), {
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
      rejecting(TOKEN_NOT_FOUND)
    )
    const service = new CommercetoolsResetPasswordService(...args)

    assert.deepEqual(
      await service.resetPassword({
        tokenValue: 'abc',
        newPassword: 'secret123',
      }),
      {
        success: false,
        statusCode: 400,
        message: 'token_invalid',
      }
    )
    assert.equal(logger.error.mock.callCount(), 0)
  })

  it('maps an expired password token to token_expired', async () => {
    const { args } = createTokenServiceDeps(
      'passwordReset',
      rejecting({
        statusCode: 400,
        body: { errors: [{ code: 'ExpiredCustomerPasswordToken' }] },
      })
    )
    const service = new CommercetoolsResetPasswordService(...args)

    assert.deepEqual(
      await service.resetPassword({
        tokenValue: 'abc',
        newPassword: 'secret123',
      }),
      {
        success: false,
        statusCode: 400,
        message: 'token_expired',
      }
    )
  })

  it('logs and returns a plain failure for unrelated errors', async () => {
    const { args, logger } = createTokenServiceDeps(
      'passwordReset',
      rejecting(new Error('network'))
    )
    const service = new CommercetoolsResetPasswordService(...args)

    assert.deepEqual(
      await service.resetPassword({
        tokenValue: 'abc',
        newPassword: 'secret123',
      }),
      { success: false }
    )
    assert.ok(logger.error.mock.callCount() > 0)
  })
})

for (const [name, schema] of [
  ['ConfirmEmailResponseSchema', ConfirmEmailResponseSchema],
  ['ResetPasswordResponseSchema', ResetPasswordResponseSchema],
]) {
  describe(`${name} message`, () => {
    for (const message of ['token_expired', 'token_invalid']) {
      it(`accepts ${message}`, () => {
        assert.equal(
          schema.safeParse({ success: false, message }).success,
          true
        )
      })
    }

    it('rejects any other value', () => {
      assert.equal(
        schema.safeParse({ success: false, message: 'token_used' }).success,
        false
      )
    })
  })
}
