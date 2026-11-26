import { CommercetoolsCustomerService } from '../customer.service'
import { CustomerScope } from '../../shared/customer-scope.service'
import { InvalidCurrentPasswordException } from '../../exceptions/invalid-current-password.exception'

const REQUEST = { currentPassword: 'old-password', newPassword: 'newpass123' }

function createService(execute: jest.Mock) {
  const post = jest.fn().mockReturnValue({ execute })
  const client = { me: () => ({ password: () => ({ post }) }) }
  const userClientService = { getClient: jest.fn().mockResolvedValue(client) }
  // A guest-scoped CustomerScope (no CustomerContext) calls me().password() on the user client
  const scope = new CustomerScope(
    {} as never,
    userClientService as never,
    { get: async () => undefined } as never
  )
  const service = new CommercetoolsCustomerService(scope, {} as never)
  const getCurrentCustomer = jest
    .spyOn(service, 'getCurrentCustomer')
    .mockResolvedValue({ version: 7 } as never)
  return { service, post, getCurrentCustomer }
}

function ctError(statusCode: number, code?: string) {
  return {
    statusCode,
    body: { errors: code ? [{ code }] : [] },
  }
}

describe('CommercetoolsCustomerService.changeCustomerPassword', () => {
  it('sends both passwords with the current customer version', async () => {
    const { service, post } = createService(jest.fn().mockResolvedValue({}))

    await service.changeCustomerPassword(REQUEST)

    expect(post).toHaveBeenCalledWith({ body: { ...REQUEST, version: 7 } })
  })

  it('maps 400 InvalidCurrentPassword to InvalidCurrentPasswordException', async () => {
    const { service } = createService(
      jest.fn().mockRejectedValue(ctError(400, 'InvalidCurrentPassword'))
    )

    await expect(
      service.changeCustomerPassword(REQUEST)
    ).rejects.toBeInstanceOf(InvalidCurrentPasswordException)
  })

  it.each([
    ['400 with another code', ctError(400, 'InvalidField')],
    ['400 without errors', ctError(400)],
    ['401 with InvalidCurrentPassword', ctError(401, 'InvalidCurrentPassword')],
    ['a network error', new Error('ECONNRESET')],
  ])('rethrows %s unchanged without retrying', async (_, error) => {
    const execute = jest.fn().mockRejectedValue(error)
    const { service } = createService(execute)

    await expect(service.changeCustomerPassword(REQUEST)).rejects.toBe(error)
    expect(execute).toHaveBeenCalledTimes(1)
  })

  describe('on 409 ConcurrentModification', () => {
    const conflict = ctError(409, 'ConcurrentModification')

    it('retries once with a freshly read version', async () => {
      const { service, post, getCurrentCustomer } = createService(
        jest.fn().mockRejectedValueOnce(conflict).mockResolvedValueOnce({})
      )
      getCurrentCustomer
        .mockResolvedValueOnce({ version: 7 } as never)
        .mockResolvedValueOnce({ version: 8 } as never)

      await expect(
        service.changeCustomerPassword(REQUEST)
      ).resolves.toBeUndefined()

      expect(post).toHaveBeenCalledTimes(2)
      expect(post).toHaveBeenLastCalledWith({
        body: { ...REQUEST, version: 8 },
      })
    })

    it('still maps a wrong current password on the retry', async () => {
      const { service } = createService(
        jest
          .fn()
          .mockRejectedValueOnce(conflict)
          .mockRejectedValueOnce(ctError(400, 'InvalidCurrentPassword'))
      )

      await expect(
        service.changeCustomerPassword(REQUEST)
      ).rejects.toBeInstanceOf(InvalidCurrentPasswordException)
    })

    it('rethrows a second 409 without retrying again', async () => {
      const execute = jest.fn().mockRejectedValue(conflict)
      const { service } = createService(execute)

      await expect(service.changeCustomerPassword(REQUEST)).rejects.toBe(
        conflict
      )
      expect(execute).toHaveBeenCalledTimes(2)
    })
  })
})
