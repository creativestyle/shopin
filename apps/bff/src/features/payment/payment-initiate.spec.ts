/**
 * Starting a payment: only for the shopper's own cart (the sealed cart cookie). A cart id from the request body that
 * is not the shopper's answers 404, the same as an unknown cart, and the payment integration is never asked, so no
 * one can re-price or get a payment link for another shopper's cart. The provider is asked for the cart's total
 * after the amounts were checked (the return checks the confirmed amount against the cart again).
 */
import { NotFoundException } from '@nestjs/common'
import { PaymentService } from './payment.service'

function setup(ownCart: string | null = 'cart-1') {
  const verifyAndUpdatePaymentAmounts = jest.fn(async () => undefined)
  const getPaymentLink = jest.fn(async (cartId: string) => ({
    paymentLink: `https://psp.example/pay/${cartId}`,
  }))
  const getCart = jest.fn(async () =>
    ownCart
      ? {
          id: ownCart,
          grandTotal: { regularPriceInCents: 4999, currency: 'EUR' },
          currency: 'EUR',
        }
      : null
  )
  const service = new PaymentService(
    {
      cartPaymentService: { verifyAndUpdatePaymentAmounts },
      paymentService: { getPaymentLink },
    } as never,
    { getCart } as never,
    { ownCartId: async () => ownCart ?? undefined } as never
  )
  return { service, verifyAndUpdatePaymentAmounts, getPaymentLink }
}

describe('payment initiate', () => {
  it('own cart: amounts are checked and the payment link is returned', async () => {
    const { service, verifyAndUpdatePaymentAmounts, getPaymentLink } = setup()
    await expect(service.initiatePayment('cart-1')).resolves.toEqual({
      paymentLink: 'https://psp.example/pay/cart-1',
    })
    expect(verifyAndUpdatePaymentAmounts).toHaveBeenCalledWith('cart-1')
    expect(getPaymentLink).toHaveBeenCalledWith('cart-1', {
      amount: 4999,
      currency: 'EUR',
    })
  })

  it('a foreign cart id: 404, the payment integration is not asked', async () => {
    const { service, verifyAndUpdatePaymentAmounts, getPaymentLink } = setup()
    const attempt = service.initiatePayment('cart-of-someone-else')
    await expect(attempt).rejects.toBeInstanceOf(NotFoundException)
    await expect(attempt).rejects.toMatchObject({ status: 404 })
    expect(verifyAndUpdatePaymentAmounts).not.toHaveBeenCalled()
    expect(getPaymentLink).not.toHaveBeenCalled()
  })

  it('no cart of this shopper: 404, the payment integration is not asked', async () => {
    const { service, verifyAndUpdatePaymentAmounts, getPaymentLink } =
      setup(null)
    await expect(service.initiatePayment('cart-1')).rejects.toMatchObject({
      status: 404,
    })
    expect(verifyAndUpdatePaymentAmounts).not.toHaveBeenCalled()
    expect(getPaymentLink).not.toHaveBeenCalled()
  })
})
