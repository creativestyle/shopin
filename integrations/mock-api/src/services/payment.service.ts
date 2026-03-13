import { Injectable, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { LANGUAGE_TOKEN } from '@core/i18n'
import type { LanguageProvider } from '@apps/bff/src/common/language/language.provider'
import type { PaymentMethodsResponse } from '@core/contracts/cart/payment-method'
import { PaymentMethodsResponseSchema } from '@core/contracts/cart/payment-method'

@Injectable()
export class PaymentService {
  constructor(
    @Inject(LANGUAGE_TOKEN) private readonly languageProvider: LanguageProvider,
    private readonly configService: ConfigService
  ) {}

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
    // Get the base URL from FRONTEND_URL (presentation URL) or use a default
    const baseUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'

    // Construct the payment link to the demo payment page
    // The locale will be handled by the frontend routing
    const paymentLink = `${baseUrl}/demo/mocked-payment-step/${cartId}`

    return { paymentLink }
  }
}
