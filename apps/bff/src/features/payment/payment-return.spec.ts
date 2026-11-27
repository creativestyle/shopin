/**
 * The payment return route: the order is created only when the payment integration says the payment was paid or
 * authorized, only for the shopper's own cart (the one the payment was started for), and only when the amount and
 * currency the provider confirmed equal the cart's total now. Anything else orders nothing. A return for a cart whose
 * order this session already created answers with that order (a reload, Retry), never with another session's.
 */
import { PaymentService } from './payment.service'

type Result = {
  status: string
  cartId: string
  amount?: number
  currency?: string
}

/** One browser session's remembered paid orders (the sealed cookie, per session). */
function sessionStore() {
  const placed = new Map<
    string,
    { cartId: string; orderId: string; status: string }
  >()
  return {
    paidOrder: jest.fn(async (cartId: string) => placed.get(cartId)),
    setPaidOrder: jest.fn(
      async (p: { cartId: string; orderId: string; status: string }) =>
        void placed.set(p.cartId, p)
    ),
  }
}

const paid = (status = 'paid', cartId = 'cart-1'): Result => ({
  status,
  cartId,
  amount: 4999,
  currency: 'EUR',
})

function setup(
  result: Result,
  ownCart: string | null = 'cart-1',
  session = sessionStore()
) {
  let own = ownCart
  // the cart as the commerce port holds it now; createOrder turns it into the order (no own cart after)
  let total = { regularPriceInCents: 4999, currency: 'EUR' }
  const getPaymentResult = jest.fn(async () => result)
  let orders = 0
  const createOrder = jest.fn(async () => {
    own = null
    return { id: `order-${++orders}` }
  })
  const getCart = jest.fn(async () =>
    own ? { id: own, grandTotal: total, currency: total.currency } : null
  )
  const service = new PaymentService(
    { paymentService: { getPaymentResult } } as never,
    { getCart } as never,
    { ownCartId: async () => own ?? undefined, createOrder } as never,
    session as never
  )
  const request = { paymentId: 'pay-1', params: { result: 'x' } }
  return {
    service,
    createOrder,
    getPaymentResult,
    request,
    session,
    /** The cart changes (an item added in another tab) after the payment started. */
    changeCart: (next: { regularPriceInCents: number; currency: string }) => {
      total = next
    },
  }
}

describe('payment return', () => {
  it.each(['paid', 'authorized'])(
    '%s: the order of the own cart is created and remembered for this cart',
    async (status) => {
      const { service, createOrder, getPaymentResult, request, session } =
        setup(paid(status))
      await expect(service.completePaymentReturn(request)).resolves.toEqual({
        status,
        orderId: 'order-1',
      })
      expect(getPaymentResult).toHaveBeenCalledWith(request)
      expect(createOrder).toHaveBeenCalledWith({ cartId: 'cart-1' })
      expect(session.setPaidOrder).toHaveBeenCalledWith({
        cartId: 'cart-1',
        orderId: 'order-1',
        status,
      })
    }
  )

  it.each(['failed', 'cancelled', 'pending'])(
    '%s: no order, the status is returned',
    async (status) => {
      const { service, createOrder, request } = setup(paid(status))
      await expect(service.completePaymentReturn(request)).resolves.toEqual({
        status,
      })
      expect(createOrder).not.toHaveBeenCalled()
    }
  )

  it("a paid payment for another cart (someone else's payment id) orders nothing", async () => {
    const { service, createOrder, request } = setup(
      paid('paid', 'cart-of-someone-else')
    )
    await expect(service.completePaymentReturn(request)).resolves.toEqual({
      status: 'failed',
    })
    expect(createOrder).not.toHaveBeenCalled()
  })

  it('no cart of this shopper: nothing is ordered', async () => {
    const { service, createOrder, request } = setup(paid(), null)
    await expect(service.completePaymentReturn(request)).resolves.toEqual({
      status: 'failed',
    })
    expect(createOrder).not.toHaveBeenCalled()
  })

  describe('the paid amount must cover the cart as it is now', () => {
    it('the cart changed after the payment started (an item added): no order', async () => {
      const { service, createOrder, request, changeCart } = setup(paid())
      changeCart({ regularPriceInCents: 7998, currency: 'EUR' })
      await expect(service.completePaymentReturn(request)).resolves.toEqual({
        status: 'failed',
      })
      expect(createOrder).not.toHaveBeenCalled()
    })

    it('the same amount in another currency: no order', async () => {
      const { service, createOrder, request, changeCart } = setup(paid())
      changeCart({ regularPriceInCents: 4999, currency: 'USD' })
      await expect(service.completePaymentReturn(request)).resolves.toEqual({
        status: 'failed',
      })
      expect(createOrder).not.toHaveBeenCalled()
    })

    it('a paid result without an amount or currency: no order', async () => {
      for (const result of [
        { status: 'paid', cartId: 'cart-1', currency: 'EUR' },
        { status: 'paid', cartId: 'cart-1', amount: 4999 },
      ]) {
        const { service, createOrder, request } = setup(result)
        await expect(service.completePaymentReturn(request)).resolves.toEqual({
          status: 'failed',
        })
        expect(createOrder).not.toHaveBeenCalled()
      }
    })
  })

  describe('a reload or Retry after the order', () => {
    it('answers with the same order, never failed, and orders nothing more', async () => {
      const { service, createOrder, request } = setup(paid())
      const first = await service.completePaymentReturn(request)
      // the cart is gone now (createOrder cleared it): the own-cart and amount checks can't pass again
      await expect(service.completePaymentReturn(request)).resolves.toEqual(
        first
      )
      await expect(service.completePaymentReturn(request)).resolves.toEqual({
        status: 'paid',
        orderId: 'order-1',
      })
      expect(createOrder).toHaveBeenCalledTimes(1)
    })

    it("another session's order for that cart is never returned", async () => {
      const alice = sessionStore()
      const placed = setup(paid(), 'cart-1', alice)
      await placed.service.completePaymentReturn(placed.request)
      expect(await alice.paidOrder('cart-1')).toBeDefined()
      // bob replays alice's paid return in his own session: no own cart of that id, nothing of alice's
      const bob = setup(paid(), 'cart-of-bob', sessionStore())
      await expect(
        bob.service.completePaymentReturn(bob.request)
      ).resolves.toEqual({ status: 'failed' })
      expect(bob.createOrder).not.toHaveBeenCalled()
    })

    it("a remembered order of another cart is not this payment's order", async () => {
      const session = sessionStore()
      await session.setPaidOrder({
        cartId: 'cart-0',
        orderId: 'order-0',
        status: 'paid',
      })
      const { service, request } = setup(paid(), 'cart-1', session)
      await expect(service.completePaymentReturn(request)).resolves.toEqual({
        status: 'paid',
        orderId: 'order-1',
      })
    })

    it('a failed result is not answered with a remembered order', async () => {
      const session = sessionStore()
      await session.setPaidOrder({
        cartId: 'cart-1',
        orderId: 'order-0',
        status: 'paid',
      })
      const { service, request } = setup(paid('failed'), 'cart-1', session)
      await expect(service.completePaymentReturn(request)).resolves.toEqual({
        status: 'failed',
      })
    })
  })
})
