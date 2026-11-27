/**
 * The payment return route: the order is created only when the payment integration says the payment was paid or
 * authorized, only for the shopper's own cart (the one the payment was started for), and only when the amount and
 * currency the provider confirmed equal the cart's total now. Anything else orders nothing. A return for a cart that
 * commerce already turned into an order this shopper may read answers with that order (a reload, Retry after a lost
 * response), never with another shopper's.
 *
 * The BFF's OrderService runs for real; commerce, the browser's cookies and the payment integration are in memory.
 * A browser's cookies change only when the response reaches it (`lost: true` drops them, as a lost response does).
 */
import { Logger } from '@nestjs/common'
import { OrderService } from '../order/order.service'
import { PaymentService } from './payment.service'

type Result = {
  status: string
  cartId: string
  amount?: number
  currency?: string
}

/** One browser: who signed in (a customer id, none for a guest) and its cookies. */
type Browser = {
  customer?: string
  cookies: { cart?: string; guestOrder?: string }
}

const paid = (status = 'paid', cartId = 'cart-1'): Result => ({
  status,
  cartId,
  amount: 4999,
  currency: 'EUR',
})

/**
 * Commerce as a platform holds it: carts with their owner and total, orders with the cart they were made from. Like
 * the mock commerce, guest orders are kept together (any guest's port call sees them); a customer's only by them.
 */
function commerce() {
  const carts = new Map<
    string,
    { owner?: string; total: { regularPriceInCents: number; currency: string } }
  >()
  const orders = new Map<string, { id: string; owner?: string }>()
  let n = 0
  return {
    carts,
    orders,
    /** The commerce port, acting for `customer` (undefined: a guest). */
    port(customer?: string) {
      return {
        createOrder: jest.fn(async ({ cartId }: { cartId: string }) => {
          const cart = carts.get(cartId)
          if (!cart || cart.owner !== customer) {
            throw Object.assign(new Error('not found'), { status: 404 })
          }
          const order = { id: `order-${++n}`, owner: customer }
          orders.set(cartId, order)
          carts.delete(cartId)
          return { id: order.id }
        }),
        findOrderByCart: jest.fn(async (cartId: string) => {
          const order = orders.get(cartId)
          return order && order.owner === customer
            ? { id: order.id }
            : undefined
        }),
      }
    },
  }
}

/** A browser with a cart of `total` in commerce, its id in the browser's cart cookie. */
function withCart(
  shop: ReturnType<typeof commerce>,
  cartId: string,
  customer?: string
): Browser {
  shop.carts.set(cartId, {
    owner: customer,
    total: { regularPriceInCents: 4999, currency: 'EUR' },
  })
  return { ...(customer ? { customer } : {}), cookies: { cart: cartId } }
}

/** The payment return of `browser`, as the BFF runs it for one request. */
async function paymentReturn(
  shop: ReturnType<typeof commerce>,
  browser: Browser,
  result: Partial<Result> & { status: string; cartId: string },
  { lost = false } = {}
) {
  // the cookies this request reads and writes; they reach the browser only with the response
  const cookies = { ...browser.cookies }
  const loggedIn = browser.customer !== undefined
  const orderPort = shop.port(browser.customer)
  const getPaymentResult = jest.fn(async () => result)
  const cartIds = {
    getGuestCartId: async () => (loggedIn ? undefined : cookies.cart),
    getLoggedInCartId: async () => (loggedIn ? cookies.cart : undefined),
    deleteGuestCartId: async () => void delete cookies.cart,
    deleteLoggedInCartId: async () => void delete cookies.cart,
  }
  const session = {
    setGuestOrder: async (id: string) => void (cookies.guestOrder = id),
    guestOrder: async () => cookies.guestOrder,
  }
  const services = {
    paymentService: { getPaymentResult },
    orderService: orderPort,
  }
  const orderService = new OrderService(
    services as never,
    cartIds as never,
    { getAuthStatus: async () => loggedIn } as never,
    session as never
  )
  const getCart = async () => {
    const cart = cookies.cart ? shop.carts.get(cookies.cart) : undefined
    return cart && cookies.cart
      ? {
          id: cookies.cart,
          grandTotal: cart.total,
          currency: cart.total.currency,
        }
      : null
  }
  const service = new PaymentService(
    services as never,
    { getCart } as never,
    orderService
  )
  const request = { paymentId: 'pay-1', params: { result: 'x' } }
  const answer = await service.completePaymentReturn(request)
  if (!lost) {
    browser.cookies = cookies
  }
  return { answer, orderPort, getPaymentResult, request }
}

describe('payment return', () => {
  it.each(['paid', 'authorized'])(
    '%s: the order of the own cart is created',
    async (status) => {
      const shop = commerce()
      const alice = withCart(shop, 'cart-1')
      const { answer, orderPort, getPaymentResult, request } =
        await paymentReturn(shop, alice, paid(status))
      expect(answer).toEqual({ status, orderId: 'order-1' })
      expect(getPaymentResult).toHaveBeenCalledWith(request)
      expect(orderPort.createOrder).toHaveBeenCalledWith({ cartId: 'cart-1' })
      // the cart became the order: its cookie is gone, the guest may read the order
      expect(alice.cookies).toEqual({ guestOrder: 'order-1' })
    }
  )

  it.each(['failed', 'cancelled', 'pending'])(
    '%s: no order, the status is returned',
    async (status) => {
      const shop = commerce()
      const { answer, orderPort } = await paymentReturn(
        shop,
        withCart(shop, 'cart-1'),
        paid(status)
      )
      expect(answer).toEqual({ status })
      expect(orderPort.createOrder).not.toHaveBeenCalled()
    }
  )

  it("a paid payment for another cart (someone else's payment id) orders nothing", async () => {
    const shop = commerce()
    withCart(shop, 'cart-of-someone-else')
    const { answer, orderPort } = await paymentReturn(
      shop,
      withCart(shop, 'cart-1'),
      paid('paid', 'cart-of-someone-else')
    )
    expect(answer).toEqual({ status: 'failed' })
    expect(orderPort.createOrder).not.toHaveBeenCalled()
  })

  it('no cart of this shopper: nothing is ordered', async () => {
    const shop = commerce()
    const { answer, orderPort } = await paymentReturn(
      shop,
      { cookies: {} },
      paid()
    )
    expect(answer).toEqual({ status: 'failed' })
    expect(orderPort.createOrder).not.toHaveBeenCalled()
    // a guest with neither a cart nor a placed order does not ask commerce for an order
    expect(orderPort.findOrderByCart).not.toHaveBeenCalled()
  })

  describe('the paid amount must cover the cart as it is now', () => {
    let warn: jest.SpyInstance
    beforeEach(() => {
      warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {})
    })
    afterEach(() => warn.mockRestore())

    it('the provider confirmed another amount than the cart total: no order; the payment, the cart and both amounts are logged', async () => {
      const shop = commerce()
      const alice = withCart(shop, 'cart-1')
      shop.carts.get('cart-1')!.total = {
        regularPriceInCents: 7998,
        currency: 'EUR',
      }
      const { answer, orderPort, request } = await paymentReturn(
        shop,
        alice,
        paid()
      )
      expect(answer).toEqual({ status: 'failed' })
      expect(orderPort.createOrder).not.toHaveBeenCalled()
      expect(alice.cookies).toEqual({ cart: 'cart-1' })
      expect(warn).toHaveBeenCalledWith(
        {
          paymentId: request.paymentId,
          cartId: 'cart-1',
          paid: { amount: 4999, currency: 'EUR' },
          cartTotal: { amount: 7998, currency: 'EUR' },
          status: 'paid',
        },
        expect.stringContaining('no order created')
      )
    })

    it('the same amount in another currency: no order', async () => {
      const shop = commerce()
      const alice = withCart(shop, 'cart-1')
      shop.carts.get('cart-1')!.total = {
        regularPriceInCents: 4999,
        currency: 'USD',
      }
      const { answer, orderPort } = await paymentReturn(shop, alice, paid())
      expect(answer).toEqual({ status: 'failed' })
      expect(orderPort.createOrder).not.toHaveBeenCalled()
    })

    it('a paid result without an amount or currency: no order', async () => {
      for (const result of [
        { status: 'paid', cartId: 'cart-1', currency: 'EUR' },
        { status: 'paid', cartId: 'cart-1', amount: 4999 },
      ]) {
        const shop = commerce()
        const { answer, orderPort } = await paymentReturn(
          shop,
          withCart(shop, 'cart-1'),
          result
        )
        expect(answer).toEqual({ status: 'failed' })
        expect(orderPort.createOrder).not.toHaveBeenCalled()
      }
    })
  })

  describe('a reload or Retry after the order: commerce holds the order, no cookie of the answer is needed', () => {
    it.each([
      ['a guest', undefined],
      ['a customer', 'customer-alice'],
    ])(
      '%s: a reload after the answer arrived gets the same order, never failed, and orders nothing more',
      async (_who, customer) => {
        const shop = commerce()
        const alice = withCart(shop, 'cart-1', customer)
        const first = await paymentReturn(shop, alice, paid())
        // the cart is gone now (the order was made from it): the own-cart and amount checks can't pass again
        const again = await paymentReturn(shop, alice, paid())
        expect(again.answer).toEqual(first.answer)
        expect(again.answer).toEqual({ status: 'paid', orderId: 'order-1' })
        expect(again.orderPort.createOrder).not.toHaveBeenCalled()
      }
    )

    it.each([
      ['a guest', undefined],
      ['a customer', 'customer-alice'],
    ])(
      '%s: the answer that placed the order is lost; Retry gets that order and finishes what the lost answer did',
      async (_who, customer) => {
        const shop = commerce()
        const alice = withCart(shop, 'cart-1', customer)
        const lost = await paymentReturn(shop, alice, paid(), { lost: true })
        expect(lost.answer).toEqual({ status: 'paid', orderId: 'order-1' })
        // nothing of that answer reached the browser: it still names the cart, and holds no record of the order
        expect(alice.cookies).toEqual({ cart: 'cart-1' })
        const retry = await paymentReturn(shop, alice, paid())
        expect(retry.answer).toEqual({ status: 'paid', orderId: 'order-1' })
        expect(retry.orderPort.createOrder).not.toHaveBeenCalled()
        expect(retry.orderPort.findOrderByCart).toHaveBeenCalledWith('cart-1')
        // the stale cart cookie is cleared; a guest may now read the order (its confirmation page)
        expect(alice.cookies).toEqual(customer ? {} : { guestOrder: 'order-1' })
        expect(shop.orders.size).toBe(1)
      }
    )

    it("another customer's order for that cart id is never returned", async () => {
      const shop = commerce()
      const alice = withCart(shop, 'cart-1', 'customer-alice')
      await paymentReturn(shop, alice, paid())
      // bob replays alice's paid return: commerce finds no order of his for that cart, and he has no such cart
      const bob = withCart(shop, 'cart-of-bob', 'customer-bob')
      const replay = await paymentReturn(shop, bob, paid())
      expect(replay.orderPort.findOrderByCart).toHaveBeenCalledWith('cart-1')
      expect(replay.answer).toEqual({ status: 'failed' })
      expect(replay.orderPort.createOrder).not.toHaveBeenCalled()
      expect(bob.cookies).toEqual({ cart: 'cart-of-bob' })
    })

    it("another guest's order for that cart id is never returned, though the platform keeps guest orders together", async () => {
      const shop = commerce()
      const alice = withCart(shop, 'cart-1')
      await paymentReturn(shop, alice, paid())
      // bob, a guest too, replays alice's paid return: the port would find the guest order, the BFF does not ask
      // for a cart this browser does not hold and an order it did not place
      for (const bob of [
        withCart(shop, 'cart-of-bob'),
        { cookies: { guestOrder: 'order-of-bob' } },
      ]) {
        const replay = await paymentReturn(shop, bob, paid())
        expect(replay.answer).toEqual({ status: 'failed' })
        expect(replay.orderPort.createOrder).not.toHaveBeenCalled()
      }
    })

    it("an order of the shopper's other cart is not this payment's order", async () => {
      const shop = commerce()
      const alice = withCart(shop, 'cart-0', 'customer-alice')
      await paymentReturn(shop, alice, paid('paid', 'cart-0'))
      const next = withCart(shop, 'cart-1', 'customer-alice')
      alice.cookies = next.cookies
      const { answer } = await paymentReturn(shop, alice, paid())
      expect(answer).toEqual({ status: 'paid', orderId: 'order-2' })
    })

    it('a failed result is not answered with the placed order', async () => {
      const shop = commerce()
      const alice = withCart(shop, 'cart-1')
      await paymentReturn(shop, alice, paid())
      const { answer, orderPort } = await paymentReturn(
        shop,
        alice,
        paid('failed')
      )
      expect(answer).toEqual({ status: 'failed' })
      expect(orderPort.findOrderByCart).not.toHaveBeenCalled()
    })
  })
})
