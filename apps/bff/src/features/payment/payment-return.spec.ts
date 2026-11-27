/**
 * The payment return route: the order is created only when the payment integration says the payment was paid or
 * authorized, and only for the shopper's own cart (the one the payment was started for). Anything else orders nothing.
 */
import { PaymentService } from './payment.service'

function setup(
  result: { status: string; cartId: string },
  ownCart: string | null = 'cart-1'
) {
  const getPaymentResult = jest.fn(async () => result)
  const createOrder = jest.fn(async () => ({ id: 'order-1' }))
  const service = new PaymentService(
    { paymentService: { getPaymentResult } } as never,
    {} as never,
    { ownCartId: async () => ownCart ?? undefined, createOrder } as never
  )
  const request = { paymentId: 'pay-1', params: { result: 'x' } }
  return { service, createOrder, getPaymentResult, request }
}

describe('payment return', () => {
  it.each(['paid', 'authorized'])(
    '%s: the order of the own cart is created',
    async (status) => {
      const { service, createOrder, getPaymentResult, request } = setup({
        status,
        cartId: 'cart-1',
      })
      await expect(service.completePaymentReturn(request)).resolves.toEqual({
        status,
        orderId: 'order-1',
      })
      expect(getPaymentResult).toHaveBeenCalledWith(request)
      expect(createOrder).toHaveBeenCalledWith({ cartId: 'cart-1' })
    }
  )

  it.each(['failed', 'cancelled', 'pending'])(
    '%s: no order, the status is returned',
    async (status) => {
      const { service, createOrder, request } = setup({
        status,
        cartId: 'cart-1',
      })
      await expect(service.completePaymentReturn(request)).resolves.toEqual({
        status,
      })
      expect(createOrder).not.toHaveBeenCalled()
    }
  )

  it("a paid payment for another cart (someone else's payment id) orders nothing", async () => {
    const { service, createOrder, request } = setup({
      status: 'paid',
      cartId: 'cart-of-someone-else',
    })
    await expect(service.completePaymentReturn(request)).resolves.toEqual({
      status: 'failed',
    })
    expect(createOrder).not.toHaveBeenCalled()
  })

  it('no cart of this shopper: nothing is ordered', async () => {
    const { service, createOrder, request } = setup(
      { status: 'paid', cartId: 'cart-1' },
      null
    )
    await expect(service.completePaymentReturn(request)).resolves.toEqual({
      status: 'failed',
    })
    expect(createOrder).not.toHaveBeenCalled()
  })
})
