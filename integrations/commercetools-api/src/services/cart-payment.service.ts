import { Injectable, Inject, Scope, forwardRef } from '@nestjs/common'
import type { CartResponse } from '@core/contracts/cart/cart'
import type { SetPaymentMethodRequest } from '@core/contracts/cart/payment-method'
import { SetPaymentMethodRequestSchema } from '@core/contracts/cart/payment-method'
import { LANGUAGE_TOKEN } from '@core/i18n'
import type { LanguageProvider } from '@apps/bff/src/common/language/language.provider'
import { UserClientService } from '../client/user-client.service'
import type { CartUpdateAction } from '../schemas/cart-update-action'
import { CartService } from './cart.service'

@Injectable({ scope: Scope.REQUEST })
export class CartPaymentService {
  constructor(
    private readonly userClientService: UserClientService,
    @Inject(forwardRef(() => CartService))
    private readonly cartService: CartService,
    @Inject(LANGUAGE_TOKEN)
    private readonly languageProvider: LanguageProvider
  ) {}

  private async getClient() {
    return this.userClientService.getClient()
  }

  /**
   * Checks if payment has transactions (from CartResponse)
   */
  private hasTransactions(
    payment: NonNullable<
      NonNullable<CartResponse['paymentInfo']>['payments']
    >[number]
  ): boolean {
    return (
      Array.isArray(payment.transactions) && payment.transactions.length > 0
    )
  }

  /**
   * Checks if payment has transactions in Success state
   * Success transactions indicate the payment has been successfully processed and cannot be changed
   * Failed payments can be retried or changed
   */
  private hasSuccessTransactions(
    payment: NonNullable<
      NonNullable<CartResponse['paymentInfo']>['payments']
    >[number]
  ): boolean {
    if (!this.hasTransactions(payment)) {
      return false
    }
    return payment.transactions!.some(
      (transaction) => transaction.state === 'Success'
    )
  }

  /**
   * Updates payment amount to match cart total
   */
  private async updatePaymentAmount(
    paymentId: string,
    paymentVersion: number,
    cartTotal: number,
    currencyCode: string
  ): Promise<void> {
    const client = await this.getClient()
    await client
      .me()
      .payments()
      .withId({ ID: paymentId })
      .post({
        body: {
          version: paymentVersion,
          actions: [
            {
              action: 'changeAmountPlanned',
              amount: {
                centAmount: cartTotal,
                currencyCode,
              },
            },
          ],
        },
      })
      .execute()
  }

  /**
   * Creates a Payment resource in commercetools
   */
  private async createPayment(
    amountCentAmount: number,
    currencyCode: string,
    paymentMethodId: string,
    paymentInterface: string,
    paymentMethodName: string,
    localizedName?: Record<string, string>
  ): Promise<string> {
    const client = await this.getClient()
    const currentLanguage = this.languageProvider.getCurrentLanguage()

    // Use localized name if provided, otherwise use paymentMethodName for current language
    const name: Record<string, string> = localizedName
      ? { ...localizedName }
      : { [currentLanguage]: paymentMethodName }

    const response = await client
      .me()
      .payments()
      .post({
        body: {
          amountPlanned: {
            centAmount: amountCentAmount,
            currencyCode,
          },
          paymentMethodInfo: {
            method: paymentMethodId,
            paymentInterface,
            name,
          },
        },
      })
      .execute()

    return response.body.id
  }

  async setPaymentMethod(
    cartId: string,
    request: SetPaymentMethodRequest
  ): Promise<CartResponse> {
    const validatedRequest = SetPaymentMethodRequestSchema.parse(request)

    // Get the cart to retrieve the total amount, currency, and existing payments
    const cart = await this.cartService.getCart(cartId, [
      'paymentInfo.payments[*]',
    ])

    // System only handles one payment per cart
    const existingPayment = cart.paymentInfo?.payments?.[0]

    // If there's an existing payment with Success transactions, check if it matches the requested method
    if (existingPayment && this.hasSuccessTransactions(existingPayment)) {
      const existingMethod = existingPayment.paymentMethodInfo?.method

      if (existingMethod === validatedRequest.paymentMethodId) {
        // Payment method is already set and has Success transactions - return the already-fetched cart
        return cart
      }

      // Payment has Success transactions but different method - we can't change it
      throw new Error(
        'Cannot change payment method: payment has already been successfully processed'
      )
    }

    // If there's an existing payment with the same payment method (without Success transactions),
    // reuse it instead of creating a duplicate
    if (
      existingPayment &&
      existingPayment.paymentMethodInfo?.method ===
        validatedRequest.paymentMethodId &&
      !this.hasSuccessTransactions(existingPayment)
    ) {
      // Payment with same method already exists and is reusable - return the cart
      return cart
    }

    // Build actions: remove existing payment if present (and doesn't have Success transactions), then add the new one
    const actions: CartUpdateAction[] = []

    // Remove existing payment if it doesn't have Success transactions
    // This includes payments with no transactions, Pending, Initial, or Failure states
    if (existingPayment && !this.hasSuccessTransactions(existingPayment)) {
      actions.push({
        action: 'removePayment',
        payment: {
          typeId: 'payment',
          id: existingPayment.id,
        },
      })
    }

    // Create a Payment resource
    const cartTotal = cart.grandTotal.regularPriceInCents
    const currencyCode = cart.currency
    const paymentId = await this.createPayment(
      cartTotal,
      currencyCode,
      validatedRequest.paymentMethodId,
      validatedRequest.paymentInterface,
      validatedRequest.paymentMethodName,
      validatedRequest.localizedDescription
    )

    // Add the new payment
    actions.push({
      action: 'addPayment',
      payment: {
        typeId: 'payment',
        id: paymentId,
      },
    })

    // Update cart with remove and add actions
    return this.cartService.updateCartWithActions(cartId, actions)
  }

  /**
   * Verifies and updates payment amounts to match cart total
   * This should be called before redirecting to payment provider
   * @param cartId - The cart ID
   * @throws Error if payment has transactions but amount doesn't match cart total
   */
  async verifyAndUpdatePaymentAmounts(cartId: string): Promise<void> {
    // Get cart with expanded payments to verify amounts
    const cart = await this.cartService.getCart(cartId, [
      'paymentInfo.payments[*]',
    ])

    const cartTotal = cart.grandTotal.regularPriceInCents
    const currencyCode = cart.currency

    // System only handles one payment per cart
    // Validate and update payment amount if cart total changed
    // This handles cases where discount codes or other changes modified the cart total
    // after payment was set
    const payment = cart.paymentInfo?.payments?.[0]

    if (payment) {
      // Skip if payment doesn't have version (not expanded)
      if (!payment.version) {
        return
      }

      // Check if payment amount matches cart total
      const paymentAmount = payment.amountPlanned?.centAmount
      const paymentCurrency = payment.amountPlanned?.currencyCode

      if (paymentAmount !== cartTotal || paymentCurrency !== currencyCode) {
        if (this.hasSuccessTransactions(payment)) {
          // Payment has Success transactions but amount doesn't match - this is a problem
          throw new Error(
            `Payment amount (${paymentAmount} ${paymentCurrency}) does not match cart total (${cartTotal} ${currencyCode}). Payment has already been successfully processed and cannot be updated.`
          )
        }

        // Payment has no Success transactions - safe to update the amount
        // This includes payments with no transactions, Pending, Initial, or Failure states
        try {
          await this.updatePaymentAmount(
            payment.id,
            payment.version,
            cartTotal,
            currencyCode
          )
        } catch (error) {
          // If payment update fails, throw error - we can't proceed with wrong amount
          throw new Error(
            `Failed to update payment amount for payment ${payment.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }
    }
  }
}
