import { Injectable } from '@nestjs/common'
import { DataSourceFactory } from '../../data-source/data-source.factory'
import { CartService } from '../cart/cart.service'
import type {
  PaymentMethodsResponse,
  SetPaymentMethodRequest,
} from '@core/contracts/cart/payment-method'
import type { CartResponse } from '@core/contracts/cart/cart'

@Injectable()
export class PaymentService {
  constructor(
    private readonly dataSourceFactory: DataSourceFactory,
    private readonly cartService: CartService
  ) {}

  async getPaymentMethods(): Promise<PaymentMethodsResponse> {
    const cart = await this.cartService.getCart({ withInventory: false })
    const paymentService = this.dataSourceFactory.getServices().paymentService
    return await paymentService.getPaymentMethods(cart?.id)
  }

  async setPaymentMethod(
    request: SetPaymentMethodRequest
  ): Promise<CartResponse> {
    // Data source re-reads the cart via me(), which checks ownership
    const cartId = await this.cartService.getOrCreateCartId()
    const cartPaymentService =
      this.dataSourceFactory.getServices().cartPaymentService
    return await cartPaymentService.setPaymentMethod(cartId, request)
  }

  async initiatePayment(cartId: string): Promise<{ paymentLink: string }> {
    // Verify and update payment amounts before redirecting to payment provider
    // This ensures payment amounts match cart total before user is redirected
    const cartPaymentService =
      this.dataSourceFactory.getServices().cartPaymentService
    await cartPaymentService.verifyAndUpdatePaymentAmounts(cartId)

    // Generate payment link after verification
    const { paymentService } = this.dataSourceFactory.getServices()
    return await paymentService.getPaymentLink(cartId)
  }
}
