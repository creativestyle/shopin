import { ConflictException } from '@nestjs/common'
import { CommercetoolsRegisterService } from '@integrations/commercetools-auth'

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
