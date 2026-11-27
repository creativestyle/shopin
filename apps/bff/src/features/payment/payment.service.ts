import { Injectable, NotFoundException } from '@nestjs/common'
import { Services } from '../../data-source/ports.module'
import { CartService } from '../cart/cart.service'
import type {
  PaymentMethodsResponse,
  PaymentReturnRequest,
  PaymentReturnResponse,
  SetPaymentMethodRequest,
} from '@core/contracts/cart/payment-method'
import { OrderService } from '../order/order.service'
import type { CartResponse } from '@core/contracts/cart/cart'

@Injectable()
export class PaymentService {
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

    // Generate payment link after verification
    const { paymentService } = this.services
    return await paymentService.getPaymentLink(cartId)
  }

  /**
   * The provider sent the shopper back: ask the payment integration for the result. Only a `paid` or `authorized`
   * payment for this shopper's own cart creates the order; anything else creates nothing and says why.
   */
  async completePaymentReturn(
    request: PaymentReturnRequest
  ): Promise<PaymentReturnResponse> {
    const result = await this.services.paymentService.getPaymentResult(request)
    if (result.status !== 'paid' && result.status !== 'authorized') {
      return { status: result.status }
    }
    const ownCart = await this.orderService.ownCartId()
    if (!ownCart || result.cartId !== ownCart) {
      // a payment for another cart (or no cart of this shopper's) orders nothing
      return { status: 'failed' }
    }
    const order = await this.orderService.createOrder({ cartId: ownCart })
    return { status: result.status, orderId: order.id }
  }
}
