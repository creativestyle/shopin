import { CustomerService } from '../customer.service'

const REQUEST = { email: 'new@example.com', currentPassword: 'secret123' }

function createService(customer: object) {
  const changeCustomerEmail = jest.fn().mockResolvedValue(customer)
  const generateEmailToken = jest
    .fn()
    .mockResolvedValue({ emailToken: 'token-1' })
  const dataSourceFactory = {
    getServices: () => ({ customerService: { changeCustomerEmail } }),
    getAuthServices: () => ({
      generateEmailTokenService: { generateEmailToken },
    }),
  }
  return {
    service: new CustomerService(dataSourceFactory as never),
    generateEmailToken,
  }
}

describe('CustomerService.changeCustomerEmail', () => {
  it('returns a verification token for the new, unverified email', async () => {
    const customer = { id: 'c1', email: REQUEST.email, isEmailVerified: false }
    const { service, generateEmailToken } = createService(customer)

    await expect(service.changeCustomerEmail(REQUEST)).resolves.toEqual({
      customer,
      emailToken: 'token-1',
    })
    expect(generateEmailToken).toHaveBeenCalledWith({ email: REQUEST.email })
  })

  it('returns no token when the email is still verified (unchanged)', async () => {
    const customer = { id: 'c1', email: REQUEST.email, isEmailVerified: true }
    const { service, generateEmailToken } = createService(customer)

    await expect(service.changeCustomerEmail(REQUEST)).resolves.toEqual({
      customer,
    })
    expect(generateEmailToken).not.toHaveBeenCalled()
  })
})
