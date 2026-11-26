import { commercetoolsAuth } from '../src/shopin'

describe('commercetools auth descriptor', () => {
  it('is the sign-in part of the commercetools provider: same id, only over commercetools commerce, no link switch', () => {
    const auth = commercetoolsAuth()
    expect(auth.id).toBe('commercetools')
    expect(Object.keys(auth.ports)).toEqual(['auth'])
    expect(Object.keys(auth.env!)).toEqual(['auth'])
    expect('linkCustomers' in auth.env!.auth!).toBe(false)
    expect(auth.requires!.auth!.needs).toEqual({ commerce: 'commercetools' })
  })
})
