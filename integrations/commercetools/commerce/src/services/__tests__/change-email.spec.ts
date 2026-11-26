import { CommercetoolsCustomerService } from '../customer.service'
import { CustomerScope } from '../../shared/customer-scope.service'
import { EmailInUseException } from '../../exceptions/email-in-use.exception'
import { EmailUnchangedException } from '../../exceptions/email-unchanged.exception'
import { InvalidCurrentPasswordException } from '../../exceptions/invalid-current-password.exception'

const CURRENT = { id: 'c1', email: 'John@example.com', version: 7 }
const REQUEST = { email: 'new@example.com', currentPassword: 'secret123' }

const UPDATED_BODY = {
  id: 'c1',
  email: 'new@example.com',
  version: 8,
  isEmailVerified: false,
}

function createService({
  login = jest.fn().mockResolvedValue({}),
  execute = jest.fn().mockResolvedValue({ body: UPDATED_BODY }),
} = {}) {
  const post = jest.fn().mockReturnValue({ execute })
  const userClient = { me: () => ({ post }) }
  const userClientService = {
    getClient: jest.fn().mockResolvedValue(userClient),
  }
  const loginPost = jest.fn().mockReturnValue({ execute: login })
  const serverClient = { login: () => ({ post: loginPost }) }
  // A guest-scoped CustomerScope (no CustomerContext) calls me().post() on the user client
  const scope = new CustomerScope(
    {} as never,
    userClientService as never,
    { get: async () => undefined } as never
  )
  const service = new CommercetoolsCustomerService(scope, serverClient as never)
  const getCurrentCustomer = jest
    .spyOn(service, 'getCurrentCustomer')
    .mockResolvedValue(CURRENT)
  return { service, post, loginPost, execute, getCurrentCustomer }
}

function ctError(statusCode: number, code: string, field?: string) {
  return { statusCode, body: { errors: [{ code, field }] } }
}

describe('CommercetoolsCustomerService.changeCustomerEmail', () => {
  it('checks the current password against the current email', async () => {
    const { service, loginPost } = createService()

    await service.changeCustomerEmail(REQUEST)

    expect(loginPost).toHaveBeenCalledWith({
      body: { email: CURRENT.email, password: REQUEST.currentPassword },
    })
  })

  it('sends exactly one changeEmail with the current version', async () => {
    const { service, post } = createService()

    const result = await service.changeCustomerEmail(REQUEST)

    expect(post).toHaveBeenCalledWith({
      body: {
        actions: [{ action: 'changeEmail', email: REQUEST.email }],
        version: 7,
      },
    })
    expect(result).toMatchObject({
      email: 'new@example.com',
      isEmailVerified: false,
    })
  })

  it('throws InvalidCurrentPasswordException and does not change the email on a wrong password', async () => {
    const { service, post } = createService({
      login: jest.fn().mockRejectedValue(ctError(400, 'InvalidCredentials')),
    })

    await expect(service.changeCustomerEmail(REQUEST)).rejects.toBeInstanceOf(
      InvalidCurrentPasswordException
    )
    expect(post).not.toHaveBeenCalled()
  })

  it('rethrows other sign-in failures unchanged', async () => {
    const error = new Error('ECONNRESET')
    const { service, post } = createService({
      login: jest.fn().mockRejectedValue(error),
    })

    await expect(service.changeCustomerEmail(REQUEST)).rejects.toBe(error)
    expect(post).not.toHaveBeenCalled()
  })

  it.each([
    ['the same email', CURRENT.email],
    ['a change in letter case only', 'john@EXAMPLE.com'],
  ])(
    'rejects %s with EmailUnchangedException so verification is not reset',
    async (_, email) => {
      const { service, post } = createService()

      await expect(
        service.changeCustomerEmail({ ...REQUEST, email })
      ).rejects.toBeInstanceOf(EmailUnchangedException)
      expect(post).not.toHaveBeenCalled()
    }
  )

  it('maps DuplicateField on email to EmailInUseException', async () => {
    const { service } = createService({
      execute: jest
        .fn()
        .mockRejectedValue(ctError(400, 'DuplicateField', 'email')),
    })

    await expect(service.changeCustomerEmail(REQUEST)).rejects.toBeInstanceOf(
      EmailInUseException
    )
  })

  describe('on 409 ConcurrentModification', () => {
    const conflict = ctError(409, 'ConcurrentModification')

    it('retries once with a freshly read version', async () => {
      const { service, post, getCurrentCustomer } = createService({
        execute: jest
          .fn()
          .mockRejectedValueOnce(conflict)
          .mockResolvedValueOnce({ body: UPDATED_BODY }),
      })
      getCurrentCustomer
        .mockResolvedValueOnce(CURRENT)
        .mockResolvedValueOnce({ ...CURRENT, version: 8 })

      await expect(service.changeCustomerEmail(REQUEST)).resolves.toMatchObject(
        { email: 'new@example.com' }
      )

      expect(post).toHaveBeenCalledTimes(2)
      expect(post).toHaveBeenLastCalledWith({
        body: {
          actions: [{ action: 'changeEmail', email: REQUEST.email }],
          version: 8,
        },
      })
    })

    it('still maps a taken email on the retry', async () => {
      const { service } = createService({
        execute: jest
          .fn()
          .mockRejectedValueOnce(conflict)
          .mockRejectedValueOnce(ctError(400, 'DuplicateField', 'email')),
      })

      await expect(service.changeCustomerEmail(REQUEST)).rejects.toBeInstanceOf(
        EmailInUseException
      )
    })

    it('rethrows a second 409 unchanged without retrying again', async () => {
      const execute = jest.fn().mockRejectedValue(conflict)
      const { service } = createService({ execute })

      await expect(service.changeCustomerEmail(REQUEST)).rejects.toBe(conflict)
      expect(execute).toHaveBeenCalledTimes(2)
    })
  })

  it('does not retry a taken email', async () => {
    const execute = jest
      .fn()
      .mockRejectedValue(ctError(409, 'DuplicateField', 'email'))
    const { service } = createService({ execute })

    await expect(service.changeCustomerEmail(REQUEST)).rejects.toBeInstanceOf(
      EmailInUseException
    )
    expect(execute).toHaveBeenCalledTimes(1)
  })
})
