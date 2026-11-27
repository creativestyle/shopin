import { RequestContext } from '@core/integration-kit'
import { Injectable, Inject, forwardRef } from '@nestjs/common'
import type { CartResponse } from '@core/contracts/cart/cart'
import type { SetPaymentMethodRequest } from '@core/contracts/cart/payment-method'
import { SetPaymentMethodRequestSchema } from '@core/contracts/cart/payment-method'
import { CustomerScope } from '../shared/customer-scope.service'
import type { CartUpdateAction } from '../schemas/cart-update-action'
import { CartService } from './cart.service'

/** A commercetools payment as this service checks it. */
interface RawPayment {
  id: string
  version?: number
  method?: string
  transactions: { type: string; state: string }[]
  amountPlanned?: { centAmount: number; currencyCode: string }
}

@Injectable()
export class CartPaymentService {
  constructor(
    private readonly scope: CustomerScope,
    @Inject(forwardRef(() => CartService))
    private readonly cartService: CartService,
    private readonly languageProvider: RequestContext
  ) {}

  /**
   * The cart's payment as commercetools keeps it (id, version, method, transactions, planned amount): read from the
   * platform cart with its payments expanded, the shopper's own cart only. SHOPin's cart contract carries only the
   * payment's flat summary, not these platform fields.
   */
  private async currentPayment(
    cartId: string
  ): Promise<RawPayment | undefined> {
    const cart = await (
      await this.scope.api()
    ).carts.get(cartId, ['paymentInfo.payments[*]'])
    const ref = cart.paymentInfo?.payments?.[0]
    if (!ref) {
      return undefined
    }
    const obj = ref.obj
    return {
      id: ref.id,
      ...(obj?.version !== undefined ? { version: obj.version } : {}),
      ...(obj?.paymentMethodInfo?.method
        ? { method: obj.paymentMethodInfo.method }
        : {}),
      transactions: obj?.transactions ?? [],
      ...(obj?.amountPlanned ? { amountPlanned: obj.amountPlanned } : {}),
    }
  }

  /**
   * Checks if payment has transactions
   */
  private hasTransactions(payment: RawPayment): boolean {
    return (
      Array.isArray(payment.transactions) && payment.transactions.length > 0
    )
  }

  /**
   * Checks if payment has transactions in Success state
   * Success transactions indicate the payment has been successfully processed and cannot be changed
   * Failed payments can be retried or changed
   */
  private hasSuccessTransactions(payment: RawPayment): boolean {
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
    cartId: string,
    paymentId: string,
    paymentVersion: number,
    cartTotal: number,
    currencyCode: string
  ): Promise<void> {
    await (
      await this.scope.api()
    ).payments.update(cartId, paymentId, paymentVersion, [
      {
        action: 'changeAmountPlanned',
        amount: {
          centAmount: cartTotal,
          currencyCode,
        },
      },
    ])
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
    const currentLanguage = this.languageProvider.getCurrentLanguage()

    // Use localized name if provided, otherwise use paymentMethodName for current language
    const name: Record<string, string> = localizedName
      ? { ...localizedName }
      : { [currentLanguage]: paymentMethodName }

    return (await this.scope.api()).payments.create({
      amountPlanned: {
        centAmount: amountCentAmount,
        currencyCode,
      },
      paymentMethodInfo: {
        method: paymentMethodId,
        paymentInterface,
        name,
      },
    })
  }

  async setPaymentMethod(
    cartId: string,
    request: SetPaymentMethodRequest
  ): Promise<CartResponse> {
    const validatedRequest = SetPaymentMethodRequestSchema.parse(request)

    // Get the cart to retrieve the total amount, currency, and existing payments
    const cart = await this.cartService.getCart(cartId, {
      withInventory: false,
    })

    // System only handles one payment per cart
    const existingPayment = await this.currentPayment(cartId)

    // If there's an existing payment with Success transactions, check if it matches the requested method
    if (existingPayment && this.hasSuccessTransactions(existingPayment)) {
      const existingMethod = existingPayment.method

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
      existingPayment.method === validatedRequest.paymentMethodId &&
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
    const cart = await this.cartService.getCart(cartId, {
      withInventory: false,
    })

    const cartTotal = cart.grandTotal.regularPriceInCents
    const currencyCode = cart.currency

    // System only handles one payment per cart
    // Validate and update payment amount if cart total changed
    // This handles cases where discount codes or other changes modified the cart total
    // after payment was set
    const payment = await this.currentPayment(cartId)

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
            cartId,
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
