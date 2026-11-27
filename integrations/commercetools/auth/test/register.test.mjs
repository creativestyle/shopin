import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { ConflictException } from '@nestjs/common'
import registerModule from '../dist/services/register.service.js'

const { CommercetoolsRegisterService } = registerModule

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
      mock.fn(async () => {
        throw {
          statusCode: 400,
          body: { errors: [{ code: 'DuplicateField', field: 'email' }] },
        }
      })
    )

    await assert.rejects(service.register(REQUEST), ConflictException)
  })

  it('rethrows a bare 409 unchanged', async () => {
    const error = { statusCode: 409 }
    const service = createService(
      mock.fn(async () => {
        throw error
      })
    )

    await assert.rejects(service.register(REQUEST), (e) => {
      assert.equal(e, error)
      return true
    })
  })
})
