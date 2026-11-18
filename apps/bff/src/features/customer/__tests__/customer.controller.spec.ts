import { InvalidCurrentPasswordException } from '@integrations/commercetools-api'
import type { Request } from 'express'
import { CustomerController } from '../customer.controller'

const REQUEST = { currentPassword: 'old-password', newPassword: 'newpass123' }

function createController(changeCustomerPassword: jest.Mock) {
  const authLogger = { log: jest.fn() }
  const tokenStorageService = { clearTokens: jest.fn() }
  const cartIdService = { deleteAllCartIds: jest.fn() }
  const controller = new CustomerController(
    { changeCustomerPassword } as never,
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
      new InvalidCurrentPasswordException(),
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
