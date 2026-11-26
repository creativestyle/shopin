import { Injectable } from '@nestjs/common'
import { Services } from '../../data-source/ports.module'
import { CartService } from '../cart/cart.service'
import type {
  PaymentMethodsResponse,
  SetPaymentMethodRequest,
} from '@core/contracts/cart/payment-method'
import type { CartResponse } from '@core/contracts/cart/cart'

@Injectable()
export class PaymentService {
  constructor(
    private readonly services: Services,
    private readonly cartService: CartService
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
    // Verify and update payment amounts before redirecting to payment provider
    // This ensures payment amounts match cart total before user is redirected
    const cartPaymentService = this.services.cartPaymentService
    await cartPaymentService.verifyAndUpdatePaymentAmounts(cartId)

    // Generate payment link after verification
    const { paymentService } = this.services
    return await paymentService.getPaymentLink(cartId)
  }
}
