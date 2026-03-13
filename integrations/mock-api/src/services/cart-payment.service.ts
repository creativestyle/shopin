import { Injectable } from '@nestjs/common'
import type { CartResponse } from '@core/contracts/cart/cart'
import type { SetPaymentMethodRequest } from '@core/contracts/cart/payment-method'
import { SetPaymentMethodRequestSchema } from '@core/contracts/cart/payment-method'
import { CartService, cartStore } from './cart.service'

@Injectable()
export class CartPaymentService {
  constructor(private readonly cartService: CartService) {}

  async setPaymentMethod(
    cartId: string,
    request: SetPaymentMethodRequest
  ): Promise<CartResponse> {
    const validatedRequest = SetPaymentMethodRequestSchema.parse(request)
    const cart = await this.cartService.getCart(cartId)

    // Update cart with payment info using Payment resource structure
    // In the mock API, we simulate a Payment resource with the payment method ID stored in method
    const updatedCart: CartResponse = {
      ...cart,
      paymentInfo: {
        payments: [
          {
            typeId: 'payment',
            id: `mock-payment-${cartId}-${Date.now()}`,
            paymentMethodInfo: {
              method: validatedRequest.paymentMethodId,
              paymentInterface: validatedRequest.paymentInterface,
            },
          },
        ],
      },
    }

    cartStore.set(cartId, updatedCart)
    return updatedCart
  }

  async verifyAndUpdatePaymentAmounts(cartId: string): Promise<void> {
    // In mock API, payment amounts are always set correctly when payment method is set
    // This is a no-op for mock, but in real implementation it would verify and update amounts
    const cart = await this.cartService.getCart(cartId)

    // Verify that payment exists and cart has items
    if (!cart.paymentInfo?.payments || cart.paymentInfo.payments.length === 0) {
      throw new Error('No payment method set for cart')
    }

    // In mock, we assume payment amounts are always correct
    // Real implementation would check and update if needed
  }
}
