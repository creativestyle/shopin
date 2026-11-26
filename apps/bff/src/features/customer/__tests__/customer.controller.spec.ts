import { HttpException, HttpStatus } from '@nestjs/common'
import {
  EMAIL_IN_USE_CODE,
  EMAIL_UNCHANGED_CODE,
  INVALID_CURRENT_PASSWORD_CODE,
} from '@core/contracts/customer/customer'
import { GUARDS_METADATA } from '@nestjs/common/constants'
import { CsrfGuard } from '../../csrf/csrf.guard'
import type { Request } from 'express'
import { CustomerController } from '../customer.controller'

const REQUEST = { currentPassword: 'old-password', newPassword: 'newpass123' }

/** What the commerce integration throws: an HttpException whose body carries the contract code. */
function contractException(status: HttpStatus, message: string, code: string) {
  return new HttpException({ statusCode: status, message, code }, status)
}

const invalidCurrentPasswordException = () =>
  contractException(
    HttpStatus.BAD_REQUEST,
    'Invalid current password',
    INVALID_CURRENT_PASSWORD_CODE
  )
const emailInUseException = () =>
  contractException(
    HttpStatus.CONFLICT,
    'Email is already in use',
    EMAIL_IN_USE_CODE
  )
const emailUnchangedException = () =>
  contractException(
    HttpStatus.BAD_REQUEST,
    'Email is unchanged',
    EMAIL_UNCHANGED_CODE
  )

function createController(
  changeCustomerPassword: jest.Mock,
  changeCustomerEmail: jest.Mock = jest.fn()
) {
  const authLogger = { log: jest.fn() }
  const tokenStorageService = { clearTokens: jest.fn() }
  const cartIdService = { deleteAllCartIds: jest.fn() }
  const controller = new CustomerController(
    { changeCustomerPassword, changeCustomerEmail } as never,
    {} as never,
    tokenStorageService as never,
    cartIdService as never,
    authLogger as never
  )
  return { controller, authLogger, tokenStorageService }
}

const req = { headers: {} } as Request

describe('CustomerController.changeCustomerPassword', () => {
  it('logs success and clears the session', async () => {
    const { controller, authLogger, tokenStorageService } = createController(
      jest.fn().mockResolvedValue(undefined)
    )

    await controller.changeCustomerPassword(req, REQUEST)

    expect(authLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'password_change', outcome: 'success' })
    )
    expect(tokenStorageService.clearTokens).toHaveBeenCalled()
  })

  it.each([
    [
      'a wrong current password',
      invalidCurrentPasswordException(),
      'invalid_credentials',
    ],
    ['any other failure', new Error('boom'), 'error'],
  ])('logs %s with reason %s', async (_, error, reason) => {
    const { controller, authLogger, tokenStorageService } = createController(
      jest.fn().mockRejectedValue(error)
    )

    await expect(controller.changeCustomerPassword(req, REQUEST)).rejects.toBe(
      error
    )

    expect(authLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'password_change',
        outcome: 'failure',
        reason,
      })
    )
    expect(tokenStorageService.clearTokens).not.toHaveBeenCalled()
  })
})

describe('CustomerController.changeCustomerEmail', () => {
  const EMAIL_REQUEST = {
    email: 'new@example.com',
    currentPassword: 'secret123',
  }
  const customer = {
    id: 'c1',
    email: 'new@example.com',
    version: 8,
    isEmailVerified: false,
  }

  it('logs success without the email addresses and returns the token', async () => {
    const { controller, authLogger } = createController(
      jest.fn(),
      jest.fn().mockResolvedValue({ customer, emailToken: 'token-1' })
    )

    await expect(
      controller.changeCustomerEmail(req, EMAIL_REQUEST)
    ).resolves.toEqual({ customer, emailToken: 'token-1' })

    expect(authLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'email_change',
        outcome: 'success',
        userId: 'c1',
      })
    )
    expect(JSON.stringify(authLogger.log.mock.calls)).not.toContain(
      'example.com'
    )
  })

  it.each([
    [
      'a wrong current password',
      invalidCurrentPasswordException(),
      'invalid_credentials',
    ],
    ['a taken email', emailInUseException(), 'user_exists'],
    ['an unchanged email', emailUnchangedException(), 'validation_failed'],
    ['any other failure', new Error('boom'), 'error'],
  ])('logs %s with reason %s', async (_, error, reason) => {
    const { controller, authLogger } = createController(
      jest.fn(),
      jest.fn().mockRejectedValue(error)
    )

    await expect(
      controller.changeCustomerEmail(req, EMAIL_REQUEST)
    ).rejects.toBe(error)

    expect(authLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'email_change',
        outcome: 'failure',
        reason,
      })
    )
  })

  it('is protected by the CSRF guard and the secure rate limit', () => {
    const handler = CustomerController.prototype.changeCustomerEmail

    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toContain(CsrfGuard)
    expect(Reflect.getMetadata('THROTTLER:SKIPdefault', handler)).toBe(true)
    expect(Reflect.getMetadataKeys(handler)).toContain('THROTTLER:LIMITsecure')
  })
})
