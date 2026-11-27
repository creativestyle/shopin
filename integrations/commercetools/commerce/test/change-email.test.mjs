import { describe, it, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'
import customerService from '../dist/services/customer.service.js'
import customerScope from '../dist/shared/customer-scope.service.js'
import emailInUse from '../dist/exceptions/email-in-use.exception.js'
import emailUnchanged from '../dist/exceptions/email-unchanged.exception.js'
import invalidCurrentPassword from '../dist/exceptions/invalid-current-password.exception.js'

const { CommercetoolsCustomerService } = customerService
const { CustomerScope } = customerScope
const { EmailInUseException } = emailInUse
const { EmailUnchangedException } = emailUnchanged
const { InvalidCurrentPasswordException } = invalidCurrentPassword

/** A mock function whose calls run `impls` in turn (call 1 the first, …); later calls return undefined. */
const sequence = (...impls) => {
  const fn = mock.fn()
  impls.forEach((impl, i) => fn.mock.mockImplementationOnce(impl, i))
  return fn
}
/** Asserts that one of the calls of `fn` got exactly `args`. */
const assertCalledWith = (fn, ...args) => {
  const calls = fn.mock.calls.map((c) => c.arguments)
  if (!calls.some((a) => isDeepStrictEqual(a, args)))
    assert.deepEqual(calls, [args])
}
/** Asserts that the last call of `fn` got exactly `args`. */
const assertLastCalledWith = (fn, ...args) =>
  assert.deepEqual(fn.mock.calls.at(-1)?.arguments, args)

const CURRENT = { id: 'c1', email: 'John@example.com', version: 7 }
const REQUEST = { email: 'new@example.com', currentPassword: 'secret123' }

const UPDATED_BODY = {
  id: 'c1',
  email: 'new@example.com',
  version: 8,
  isEmailVerified: false,
}

afterEach(() => mock.restoreAll())

function createService({
  login = mock.fn(async () => ({})),
  execute = mock.fn(async () => ({ body: UPDATED_BODY })),
} = {}) {
  const post = mock.fn(() => ({ execute }))
  const userClient = { me: () => ({ post }) }
  const userClientService = {
    getClient: mock.fn(async () => userClient),
  }
  const loginPost = mock.fn(() => ({ execute: login }))
  const serverClient = { login: () => ({ post: loginPost }) }
  // A guest-scoped CustomerScope (no CustomerContext) calls me().post() on the user client
  const scope = new CustomerScope({}, userClientService, {
    get: async () => undefined,
  })
  const service = new CommercetoolsCustomerService(scope, serverClient)
  const getCurrentCustomer = mock.method(
    service,
    'getCurrentCustomer',
    async () => CURRENT
  )
  return { service, post, loginPost, execute, getCurrentCustomer }
}

function ctError(statusCode, code, field) {
  return { statusCode, body: { errors: [{ code, field }] } }
}

describe('CommercetoolsCustomerService.changeCustomerEmail', () => {
  it('checks the current password against the current email', async () => {
    const { service, loginPost } = createService()

    await service.changeCustomerEmail(REQUEST)

    assertCalledWith(loginPost, {
      body: { email: CURRENT.email, password: REQUEST.currentPassword },
    })
  })

  it('sends exactly one changeEmail with the current version', async () => {
    const { service, post } = createService()

    const result = await service.changeCustomerEmail(REQUEST)

    assertCalledWith(post, {
      body: {
        actions: [{ action: 'changeEmail', email: REQUEST.email }],
        version: 7,
      },
    })
    assert.equal(result.email, 'new@example.com')
    assert.equal(result.isEmailVerified, false)
  })

  it('throws InvalidCurrentPasswordException and does not change the email on a wrong password', async () => {
    const { service, post } = createService({
      login: mock.fn(async () => {
        throw ctError(400, 'InvalidCredentials')
      }),
    })

    await assert.rejects(
      service.changeCustomerEmail(REQUEST),
      InvalidCurrentPasswordException
    )
    assert.equal(post.mock.callCount(), 0)
  })

  it('rethrows other sign-in failures unchanged', async () => {
    const error = new Error('ECONNRESET')
    const { service, post } = createService({
      login: mock.fn(async () => {
        throw error
      }),
    })

    await assert.rejects(service.changeCustomerEmail(REQUEST), (e) => {
      assert.equal(e, error)
      return true
    })
    assert.equal(post.mock.callCount(), 0)
  })

  for (const [name, email] of [
    ['the same email', CURRENT.email],
    ['a change in letter case only', 'john@EXAMPLE.com'],
  ]) {
    it(`rejects ${name} with EmailUnchangedException so verification is not reset`, async () => {
      const { service, post } = createService()

      await assert.rejects(
        service.changeCustomerEmail({ ...REQUEST, email }),
        EmailUnchangedException
      )
      assert.equal(post.mock.callCount(), 0)
    })
  }

  it('maps DuplicateField on email to EmailInUseException', async () => {
    const { service } = createService({
      execute: mock.fn(async () => {
        throw ctError(400, 'DuplicateField', 'email')
      }),
    })

    await assert.rejects(
      service.changeCustomerEmail(REQUEST),
      EmailInUseException
    )
  })

  describe('on 409 ConcurrentModification', () => {
    const conflict = ctError(409, 'ConcurrentModification')

    it('retries once with a freshly read version', async () => {
      const { service, post, getCurrentCustomer } = createService({
        execute: sequence(
          async () => {
            throw conflict
          },
          async () => ({ body: UPDATED_BODY })
        ),
      })
      getCurrentCustomer.mock.mockImplementationOnce(async () => CURRENT, 0)
      getCurrentCustomer.mock.mockImplementationOnce(
        async () => ({ ...CURRENT, version: 8 }),
        1
      )

      const result = await service.changeCustomerEmail(REQUEST)
      assert.equal(result.email, 'new@example.com')

      assert.equal(post.mock.callCount(), 2)
      assertLastCalledWith(post, {
        body: {
          actions: [{ action: 'changeEmail', email: REQUEST.email }],
          version: 8,
        },
      })
    })

    it('still maps a taken email on the retry', async () => {
      const { service } = createService({
        execute: sequence(
          async () => {
            throw conflict
          },
          async () => {
            throw ctError(400, 'DuplicateField', 'email')
          }
        ),
      })

      await assert.rejects(
        service.changeCustomerEmail(REQUEST),
        EmailInUseException
      )
    })

    it('rethrows a second 409 unchanged without retrying again', async () => {
      const execute = mock.fn(async () => {
        throw conflict
      })
      const { service } = createService({ execute })

      await assert.rejects(service.changeCustomerEmail(REQUEST), (e) => {
        assert.equal(e, conflict)
        return true
      })
      assert.equal(execute.mock.callCount(), 2)
    })
  })

  it('does not retry a taken email', async () => {
    const execute = mock.fn(async () => {
      throw ctError(409, 'DuplicateField', 'email')
    })
    const { service } = createService({ execute })

    await assert.rejects(
      service.changeCustomerEmail(REQUEST),
      EmailInUseException
    )
    assert.equal(execute.mock.callCount(), 1)
  })
})
