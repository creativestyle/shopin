import { PAYMENT_STEP_PATH } from '@core/contracts/core/data-source-interfaces'
import { RequestContext } from '@core/integration-kit'
import { Injectable } from '@nestjs/common'
import type { PaymentMethodsResponse } from '@core/contracts/cart/payment-method'
import { PaymentMethodsResponseSchema } from '@core/contracts/cart/payment-method'

@Injectable()
export class PaymentService {
  constructor(private readonly languageProvider: RequestContext) {}

  async getPaymentMethods(): Promise<PaymentMethodsResponse> {
    const mockPaymentMethods = [
      {
        id: 'invoice',
        name: 'Invoice',
        localizedDescription: {
          de: 'Rechnung (Zahlung innerhalb von 14 Tagen)',
          en: 'Invoice (Payment within 14 days)',
        },
        method: 'invoice',
        paymentInterface: 'mocked',
        isDefault: true,
      },
      {
        id: 'prepayment',
        name: 'Prepayment',
        localizedDescription: {
          de: 'Vorkasse (Überweisung im Voraus)',
          en: 'Prepayment (Bank transfer in advance)',
        },
        method: 'bank-transfer',
        paymentInterface: 'mocked',
        isDefault: false,
      },
    ]

    return PaymentMethodsResponseSchema.parse({
      paymentMethods: mockPaymentMethods,
    })
  }

  /**
   * Generates a payment link for the demo payment provider.
   * In a real scenario, this would call an external payment provider API.
   *
   * @param cartId - The cart ID to use as the payment identifier
   * @returns Payment link to redirect the user to
   */
  async getPaymentLink(cartId: string): Promise<{ paymentLink: string }> {
    // the storefront's own URL comes from the core (a part never reads FRONTEND_URL)
    const baseUrl = this.languageProvider.storefrontUrl

    // the storefront's own payment step (the PaymentStep slot, which this integration's descriptor requires);
    // the locale is handled by the storefront's routing
    const paymentLink = `${baseUrl}${PAYMENT_STEP_PATH}/${encodeURIComponent(cartId)}`

    return { paymentLink }
  }
}
