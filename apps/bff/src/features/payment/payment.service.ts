import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { Services } from '../../data-source/ports.module'
import { CartService } from '../cart/cart.service'
import type {
  PaymentAmount,
  PaymentMethodsResponse,
  PaymentReturnRequest,
  PaymentReturnResponse,
  SetPaymentMethodRequest,
} from '@core/contracts/cart/payment-method'
import { OrderService } from '../order/order.service'
import type { CartResponse } from '@core/contracts/cart/cart'

/** The cart's total as a payment is started for it and checked against at the return: minor units and currency. */
function totalOf(cart: CartResponse): PaymentAmount {
  return {
    amount: cart.grandTotal.regularPriceInCents,
    currency: cart.grandTotal.currency,
  }
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name)

  constructor(
    private readonly services: Services,
    private readonly cartService: CartService,
    private readonly orderService: OrderService
  ) {}

  async getPaymentMethods(): Promise<PaymentMethodsResponse> {
    const cart = await this.cartService.getCart({ withInventory: false })
    const paymentService = this.services.paymentService
    return await paymentService.getPaymentMethods(cart?.id)
  }

  async setPaymentMethod(
    request: SetPaymentMethodRequest
  ): Promise<CartResponse> {
    // Data source re-reads the cart via me(), which checks ownership
    const cartId = await this.cartService.getOrCreateCartId()
    const cartPaymentService = this.services.cartPaymentService
    return await cartPaymentService.setPaymentMethod(cartId, request)
  }

  async initiatePayment(cartId: string): Promise<{ paymentLink: string }> {
    // Only the shopper's own cart can be paid for; same 404 as an unknown cart (no hint that the id exists)
    const ownCart = await this.orderService.ownCartId()
    if (!ownCart || ownCart !== cartId) {
      throw new NotFoundException(`Cart not found: ${cartId}`)
    }

    // Verify and update payment amounts before redirecting to payment provider
    // This ensures payment amounts match cart total before user is redirected
    const cartPaymentService = this.services.cartPaymentService
    await cartPaymentService.verifyAndUpdatePaymentAmounts(cartId)

    // the provider is asked for the cart's total as it is now; the return checks the confirmed amount against it
    const cart = await this.cartService.getCart({ withInventory: false })
    if (!cart || cart.id !== cartId) {
      throw new NotFoundException(`Cart not found: ${cartId}`)
    }
    const { paymentService } = this.services
    return await paymentService.getPaymentLink(cartId, totalOf(cart))
  }

  /**
   * The provider sent the shopper back: ask the payment integration for the result. In this order:
   * 1. only a `paid` or `authorized` payment goes on; anything else creates nothing and says why;
   * 2. an order commerce already holds for the payment's cart and this shopper may read (`OrderService.placedOrderOf`:
   *    a reload, the back button, Retry after a lost response) is answered again: the cart is gone by then, so the
   *    checks below can't run twice;
   * 3. the payment must be for this shopper's own cart;
   * 4. the amount and currency the provider confirmed must equal the cart's total now (a cart changed while the
   *    provider's page was open is not ordered against the old payment);
   * 5. the order is created.
   * A failed check answers `failed`, which sends the shopper back to pay again.
   */
  async completePaymentReturn(
    request: PaymentReturnRequest
  ): Promise<PaymentReturnResponse> {
    const result = await this.services.paymentService.getPaymentResult(request)
    if (result.status !== 'paid' && result.status !== 'authorized') {
      return { status: result.status }
    }
    const placed = await this.orderService.placedOrderOf(result.cartId)
    if (placed) {
      return { status: result.status, orderId: placed.id }
    }
    const ownCart = await this.orderService.ownCartId()
    if (!ownCart || result.cartId !== ownCart) {
      // a payment for another cart (or no cart of this shopper's) orders nothing
      return { status: 'failed' }
    }
    const cart = await this.cartService.getCart({ withInventory: false })
    const total = cart?.id === ownCart ? totalOf(cart) : undefined
    if (
      !total ||
      result.amount !== total.amount ||
      result.currency !== total.currency
    ) {
      // the payment does not cover this cart as it is now: no order; the money the provider took is not released
      // here (no void step yet), so the case is logged with what links the payment to the cart
      this.logger.warn(
        {
          paymentId: request.paymentId,
          cartId: ownCart,
          paid: { amount: result.amount, currency: result.currency },
          cartTotal: total ?? null,
          status: result.status,
        },
        'Payment confirmed for an amount that does not match the cart: no order created'
      )
      return { status: 'failed' }
    }
    const order = await this.orderService.createOrder({ cartId: ownCart })
    return { status: result.status, orderId: order.id }
  }
}
