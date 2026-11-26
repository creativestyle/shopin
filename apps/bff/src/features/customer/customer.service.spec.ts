import { CustomerService } from './customer.service'

describe('CustomerService.changeCustomerPassword', () => {
  it('revokes the other sessions after the password changed, and not when it failed', async () => {
    const calls: string[] = []
    const session = {
      revokeOtherSessions: async () => void calls.push('revoke'),
    }
    let fail = false
    const services = {
      customerService: {
        changeCustomerPassword: async () => {
          calls.push('change')
          if (fail) {
            throw new Error('wrong current password')
          }
        },
      },
    }
    const service = new CustomerService(
      services as never,
      session as never,
      {} as never
    )
    const request = { currentPassword: 'old', newPassword: 'new-secret-1' }
    await service.changeCustomerPassword(request)
    expect(calls).toEqual(['change', 'revoke'])
    fail = true
    await expect(service.changeCustomerPassword(request)).rejects.toThrow()
    expect(calls).toEqual(['change', 'revoke', 'change'])
  })
})
