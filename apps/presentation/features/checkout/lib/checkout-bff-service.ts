import {
  CartResponseSchema,
  type CartResponse,
  SetBillingAddressRequestSchema,
  SetShippingAddressRequestSchema,
} from '@core/contracts/cart/cart'
import type { AddressBase } from '@core/contracts/address/address-base'
import {
  PaymentMethodsResponseSchema,
  SetPaymentMethodRequestSchema,
  type PaymentMethodsResponse,
  type SetPaymentMethodRequest,
} from '@core/contracts/cart/payment-method'
import {
  ShippingMethodsResponseSchema,
  SetShippingMethodRequestSchema,
  type ShippingMethodsResponse,
  type SetShippingMethodRequest,
} from '@core/contracts/cart/shipping-method'
import { BaseService } from '@/lib/bff/services/base-service'

/**
 * Service for checkout operations (shipping, addresses, payment).
 * Owned by the checkout feature.
 */
export class CheckoutService extends BaseService {
  /**
   * Get available shipping methods
   */
  async getShippingMethods(): Promise<ShippingMethodsResponse> {
    const data = await this.get<ShippingMethodsResponse>(
      '/cart/shipping-methods'
    )
    return ShippingMethodsResponseSchema.parse(data)
  }

  /**
   * Set shipping method for checkout
   */
  async setShippingMethod(
    request: SetShippingMethodRequest
  ): Promise<CartResponse> {
    const validatedRequest = SetShippingMethodRequestSchema.parse(request)
    const data = await this.put<CartResponse>(
      '/cart/shipping-method',
      validatedRequest
    )
    return CartResponseSchema.parse(data)
  }

  /**
   * Set shipping address for checkout
   */
  async setShippingAddress(request: AddressBase): Promise<CartResponse> {
    const validatedRequest = SetShippingAddressRequestSchema.parse(request)
    const data = await this.put<CartResponse>(
      '/cart/shipping-address',
      validatedRequest
    )
    return CartResponseSchema.parse(data)
  }

  /**
   * Set billing address for checkout
   */
  async setBillingAddress(request: AddressBase): Promise<CartResponse> {
    const validatedRequest = SetBillingAddressRequestSchema.parse(request)
    const data = await this.put<CartResponse>(
      '/cart/billing-address',
      validatedRequest
    )
    return CartResponseSchema.parse(data)
  }

  /**
   * Get available payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethodsResponse> {
    const data = await this.get<PaymentMethodsResponse>('/payment/methods')
    return PaymentMethodsResponseSchema.parse(data)
  }

  /**
   * Set payment method for checkout
   */
  async setPaymentMethod(
    request: SetPaymentMethodRequest
  ): Promise<CartResponse> {
    const validatedRequest = SetPaymentMethodRequestSchema.parse(request)
    const data = await this.put<CartResponse>(
      '/payment/method',
      validatedRequest
    )
    return CartResponseSchema.parse(data)
  }

  /**
   * Initiate payment and get payment link
   */
  async initiatePayment(cartId: string): Promise<{ paymentLink: string }> {
    const data = await this.post<{ paymentLink: string }>('/payment/initiate', {
      cartId,
    })
    return data
  }
}
