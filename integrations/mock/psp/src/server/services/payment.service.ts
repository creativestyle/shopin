import { PAYMENT_STEP_PATH } from '@core/contracts/core/data-source-interfaces'
import { RequestContext } from '@core/integration-kit'
import { Injectable } from '@nestjs/common'
import type {
  PaymentAmount,
  PaymentMethodsResponse,
} from '@core/contracts/cart/payment-method'
import {
  PaymentMethodsResponseSchema,
  PaymentStatusSchema,
  type PaymentResult,
  type PaymentReturnRequest,
} from '@core/contracts/cart/payment-method'

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
        provider: 'mocked',
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
        provider: 'mocked',
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
   * @param total - What the shopper pays: the pretend page carries it and reports it back as the confirmed amount
   * @returns Payment link to redirect the user to
   */
  async getPaymentLink(
    cartId: string,
    total: PaymentAmount
  ): Promise<{ paymentLink: string }> {
    // the storefront's own URL comes from the core (a part never reads FRONTEND_URL)
    const baseUrl = this.languageProvider.storefrontUrl

    // the storefront's own payment step (the PaymentStep slot, which this integration's descriptor requires);
    // the locale is handled by the storefront's routing
    const query = new URLSearchParams({
      amount: String(total.amount),
      currency: total.currency,
    })
    const paymentLink = `${baseUrl}${PAYMENT_STEP_PATH}/${encodeURIComponent(cartId)}?${query.toString()}`

    return { paymentLink }
  }

  /**
   * The mock provider's answer for a payment its pretend page finished: the page sends the shopper back to the
   * shop's return route with `result=<status>`, any payment status a provider reports (paid, authorized, pending,
   * failed, cancelled), so every outcome of the return route can be tried. No money moves: a missing or unknown
   * result is a failed payment, never a paid one. The amount and currency are what the pretend page was opened for
   * (its link) and sends back: the amount it "charged". No money moves, so the shopper may edit them; the BFF still
   * orders only when they equal the cart's total.
   */
  async getPaymentResult({
    paymentId,
    params,
  }: PaymentReturnRequest): Promise<PaymentResult> {
    // the mock's payment id is the cart id its payment link was made for
    const reported = PaymentStatusSchema.safeParse(params.result)
    const amount = /^\d+$/.test(params.amount ?? '')
      ? Number(params.amount)
      : undefined
    return {
      status: reported.success ? reported.data : 'failed',
      cartId: paymentId,
      ...(amount !== undefined && Number.isSafeInteger(amount)
        ? { amount }
        : {}),
      ...(params.currency ? { currency: params.currency } : {}),
    }
  }
}
