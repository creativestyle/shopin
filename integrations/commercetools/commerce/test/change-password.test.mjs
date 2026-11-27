import { describe, it, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'
import customerService from '../dist/services/customer.service.js'
import customerScope from '../dist/shared/customer-scope.service.js'
import invalidCurrentPassword from '../dist/exceptions/invalid-current-password.exception.js'

const { CommercetoolsCustomerService } = customerService
const { CustomerScope } = customerScope
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

const REQUEST = { currentPassword: 'old-password', newPassword: 'newpass123' }

afterEach(() => mock.restoreAll())

function createService(execute) {
  const post = mock.fn(() => ({ execute }))
  const client = { me: () => ({ password: () => ({ post }) }) }
  const userClientService = { getClient: mock.fn(async () => client) }
  // A guest-scoped CustomerScope (no CustomerContext) calls me().password() on the user client
  const scope = new CustomerScope({}, userClientService, {
    get: async () => undefined,
  })
  const service = new CommercetoolsCustomerService(scope, {})
  const getCurrentCustomer = mock.method(
    service,
    'getCurrentCustomer',
    async () => ({ version: 7 })
  )
  return { service, post, getCurrentCustomer }
}

function ctError(statusCode, code) {
  return {
    statusCode,
    body: { errors: code ? [{ code }] : [] },
  }
}

describe('CommercetoolsCustomerService.changeCustomerPassword', () => {
  it('sends both passwords with the current customer version', async () => {
    const { service, post } = createService(mock.fn(async () => ({})))

    await service.changeCustomerPassword(REQUEST)

    assertCalledWith(post, { body: { ...REQUEST, version: 7 } })
  })

  it('maps 400 InvalidCurrentPassword to InvalidCurrentPasswordException', async () => {
    const { service } = createService(
      mock.fn(async () => {
        throw ctError(400, 'InvalidCurrentPassword')
      })
    )

    await assert.rejects(
      service.changeCustomerPassword(REQUEST),
      InvalidCurrentPasswordException
    )
  })

  for (const [name, error] of [
    ['400 with another code', ctError(400, 'InvalidField')],
    ['400 without errors', ctError(400)],
    ['401 with InvalidCurrentPassword', ctError(401, 'InvalidCurrentPassword')],
    ['a network error', new Error('ECONNRESET')],
  ]) {
    it(`rethrows ${name} unchanged without retrying`, async () => {
      const execute = mock.fn(async () => {
        throw error
      })
      const { service } = createService(execute)

      await assert.rejects(service.changeCustomerPassword(REQUEST), (e) => {
        assert.equal(e, error)
        return true
      })
      assert.equal(execute.mock.callCount(), 1)
    })
  }

  describe('on 409 ConcurrentModification', () => {
    const conflict = ctError(409, 'ConcurrentModification')

    it('retries once with a freshly read version', async () => {
      const { service, post, getCurrentCustomer } = createService(
        sequence(
          async () => {
            throw conflict
          },
          async () => ({})
        )
      )
      getCurrentCustomer.mock.mockImplementationOnce(
        async () => ({ version: 7 }),
        0
      )
      getCurrentCustomer.mock.mockImplementationOnce(
        async () => ({ version: 8 }),
        1
      )

      assert.equal(await service.changeCustomerPassword(REQUEST), undefined)

      assert.equal(post.mock.callCount(), 2)
      assertLastCalledWith(post, {
        body: { ...REQUEST, version: 8 },
      })
    })

    it('still maps a wrong current password on the retry', async () => {
      const { service } = createService(
        sequence(
          async () => {
            throw conflict
          },
          async () => {
            throw ctError(400, 'InvalidCurrentPassword')
          }
        )
      )

      await assert.rejects(
        service.changeCustomerPassword(REQUEST),
        InvalidCurrentPasswordException
      )
    })

    it('rethrows a second 409 without retrying again', async () => {
      const execute = mock.fn(async () => {
        throw conflict
      })
      const { service } = createService(execute)

      await assert.rejects(service.changeCustomerPassword(REQUEST), (e) => {
        assert.equal(e, conflict)
        return true
      })
      assert.equal(execute.mock.callCount(), 2)
    })
  })
})
