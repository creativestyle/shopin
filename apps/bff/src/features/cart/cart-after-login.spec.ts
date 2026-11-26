/**
 * The cart after sign-in through another identity provider (commerce with `attachGuestCart`): the guest cart is taken
 * over before anything else, its items are never dropped for an older cart, and the guest cookie goes only once the
 * cart is settled. The platform's own sign-in (it merges at sign-in) leaves the take-over out.
 */
import { NotFoundException, ServiceUnavailableException } from '@nestjs/common'

const mockProviders: { commerce: string; auth?: string } = {
  commerce: 'shop',
  auth: 'idp',
}
jest.mock('../../data-source/providers', () => ({
  keyOf: (id: string) => id,
  currentProviders: () => ({ providers: mockProviders, unavailable: {} }),
}))
import { CartService } from './cart.service'

function setup(opts: { attach?: jest.Mock; active?: { id: string } | null }) {
  const ids = {
    deleteGuestCartId: jest.fn(),
    setLoggedInCartId: jest.fn(),
  }
  const getActiveCart = jest.fn(async () => opts.active ?? null)
  const service = new CartService(
    { cartService: { getActiveCart } } as never,
    { commerce: { attachGuestCart: opts.attach } } as never,
    ids as never,
    {} as never,
    {} as never
  )
  return { service, ids, getActiveCart }
}
const cart = (id: string, items: number) => ({
  id,
  lineItems: Array.from({ length: items }, (_, i) => ({ id: `l${i}` })),
})

afterEach(() => {
  mockProviders.auth = 'idp'
})

describe('sign-in through another identity provider', () => {
  it("the guest's items win over the customer's older cart (taken over first, before the guest token goes)", async () => {
    const attach = jest.fn(async () => cart('guest-1', 2))
    const { service, ids, getActiveCart } = setup({
      attach,
      active: { id: 'old-1' },
    })
    await service.setupCartAfterLogin('guest-1')
    expect(attach).toHaveBeenCalledWith('guest-1')
    expect(ids.setLoggedInCartId).toHaveBeenCalledWith('guest-1')
    expect(getActiveCart).not.toHaveBeenCalled()
    expect(ids.deleteGuestCartId).toHaveBeenCalled()
  })

  it("an empty guest cart leaves the customer's active cart in charge", async () => {
    const { service, ids } = setup({
      attach: jest.fn(async () => cart('guest-1', 0)),
      active: { id: 'old-1' },
    })
    await service.setupCartAfterLogin('guest-1')
    expect(ids.setLoggedInCartId).toHaveBeenCalledWith('old-1')
  })

  it("a cart the platform refuses as another shopper's is dropped; the customer's own cart stays", async () => {
    const { service, ids } = setup({
      attach: jest.fn(async () => {
        throw new NotFoundException()
      }),
      active: { id: 'old-1' },
    })
    await service.setupCartAfterLogin('guest-1')
    expect(ids.deleteGuestCartId).toHaveBeenCalled()
    expect(ids.setLoggedInCartId).toHaveBeenCalledWith('old-1')
  })

  it('an outage during the take-over keeps the guest cookie (nothing is lost) and is rethrown', async () => {
    const { service, ids } = setup({
      attach: jest.fn(async () => {
        throw new ServiceUnavailableException()
      }),
    })
    await expect(service.setupCartAfterLogin('guest-1')).rejects.toBeInstanceOf(
      ServiceUnavailableException
    )
    expect(ids.deleteGuestCartId).not.toHaveBeenCalled()
  })
})

describe("the platform's own sign-in", () => {
  it('merged at sign-in already: its active cart wins, no take-over', async () => {
    mockProviders.auth = 'shop'
    const attach = jest.fn()
    const { service, ids } = setup({ attach, active: { id: 'merged-1' } })
    await service.setupCartAfterLogin('guest-1')
    expect(attach).not.toHaveBeenCalled()
    expect(ids.setLoggedInCartId).toHaveBeenCalledWith('merged-1')
  })
})
