import type { PaymentInfoResponse } from '@core/contracts/cart/cart'

/**
 * Extracts the payment method ID from payment info
 * @param paymentInfo - The payment info from cart or order
 * @returns The payment method ID (e.g., 'prepayment', 'invoice') or undefined
 */
export function getPaymentMethodId(
  paymentInfo: PaymentInfoResponse | undefined
): string | undefined {
  return paymentInfo?.method
}

/**
 * Extracts the payment interface from payment info
 * @param paymentInfo - The payment info from cart or order
 * @returns The payment interface (e.g., 'internal', 'stripe', 'paypal') or undefined
 */
export function getPaymentInterface(
  paymentInfo: PaymentInfoResponse | undefined
): string | undefined {
  return paymentInfo?.provider
}

/**
 * Extracts the localized payment method name from payment info
 * @param paymentInfo - The payment info from cart or order
 * @param locale - The current locale (e.g., 'de', 'en')
 * @returns The localized payment method name or null if not resolved (caller should use translation)
 */
export function getPaymentMethodName(
  paymentInfo: PaymentInfoResponse | undefined,
  locale: string
): string | null {
  const localizedName = paymentInfo?.name

  if (!localizedName) {
    return null
  }

  // Try current locale first, then fallback to any available
  return localizedName[locale] || Object.values(localizedName)[0] || null
}
