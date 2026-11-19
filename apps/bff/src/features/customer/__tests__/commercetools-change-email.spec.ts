import {
  CommercetoolsCustomerService,
  EmailInUseException,
  InvalidCurrentPasswordException,
} from '@integrations/commercetools-api'

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
  const serverClientService = {
    getClient: () => ({ login: () => ({ post: loginPost }) }),
  }
  const service = new CommercetoolsCustomerService(
    userClientService as never,
    serverClientService as never
  )
  jest.spyOn(service, 'getCurrentCustomer').mockResolvedValue(CURRENT)
  return { service, post, loginPost, execute }
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
  ])('treats %s as a no-op so verification is not reset', async (_, email) => {
    const { service, post } = createService()

    const result = await service.changeCustomerEmail({ ...REQUEST, email })

    expect(post).not.toHaveBeenCalled()
    expect(result).toBe(CURRENT)
  })

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

  it('rethrows a ConcurrentModification unchanged, not as email in use', async () => {
    const conflict = ctError(409, 'ConcurrentModification')
    const { service } = createService({
      execute: jest.fn().mockRejectedValue(conflict),
    })

    await expect(service.changeCustomerEmail(REQUEST)).rejects.toBe(conflict)
  })
})
