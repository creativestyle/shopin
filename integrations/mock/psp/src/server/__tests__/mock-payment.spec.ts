import { PaymentMethodsResponseSchema } from '@core/contracts/cart/payment-method'
import { PaymentService } from '..'

function createService(frontendUrl?: string) {
  const config = {
    get: (key: string) => (key === 'FRONTEND_URL' ? frontendUrl : undefined),
  }
  return new PaymentService(
    { getCurrentLanguage: () => 'en-US' } as never,
    config as never
  )
}

describe('mock PaymentService', () => {
  it('offers invoice (the default) and prepayment as valid payment methods', async () => {
    const { paymentMethods } = await createService().getPaymentMethods()
    expect(() =>
      PaymentMethodsResponseSchema.parse({ paymentMethods })
    ).not.toThrow()
    expect(paymentMethods.map((m) => [m.id, m.isDefault])).toEqual([
      ['invoice', true],
      ['prepayment', false],
    ])
  })

  it("links to the storefront's demo payment page for the cart", async () => {
    const { paymentLink } = await createService(
      'https://shop.example'
    ).getPaymentLink('cart-1')
    expect(paymentLink).toBe(
      'https://shop.example/demo/mocked-payment-step/cart-1'
    )
  })
})
