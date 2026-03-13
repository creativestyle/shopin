import type { PaymentInfoResponse } from '@core/contracts/cart/cart'

/**
 * Gets the first payment from payment info
 * @param paymentInfo - The payment info from cart or order
 * @returns The first payment or undefined if no payments exist
 */
function getFirstPayment(paymentInfo: PaymentInfoResponse | undefined) {
  if (!paymentInfo?.payments || paymentInfo.payments.length === 0) {
    return undefined
  }

  return paymentInfo.payments[0]
}

/**
 * Extracts the payment method ID from payment info
 * @param paymentInfo - The payment info from cart or order
 * @returns The payment method ID (e.g., 'prepayment', 'invoice') or undefined
 */
export function getPaymentMethodId(
  paymentInfo: PaymentInfoResponse | undefined
): string | undefined {
  const firstPayment = getFirstPayment(paymentInfo)
  return firstPayment?.paymentMethodInfo?.method
}

/**
 * Extracts the payment interface from payment info
 * @param paymentInfo - The payment info from cart or order
 * @returns The payment interface (e.g., 'internal', 'stripe', 'paypal') or undefined
 */
export function getPaymentInterface(
  paymentInfo: PaymentInfoResponse | undefined
): string | undefined {
  const firstPayment = getFirstPayment(paymentInfo)
  return firstPayment?.paymentMethodInfo?.paymentInterface
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
  const firstPayment = getFirstPayment(paymentInfo)
  if (!firstPayment) {
    return null
  }

  const localizedName = firstPayment.paymentMethodInfo?.name

  if (!localizedName) {
    return null
  }

  // Try current locale first, then fallback to any available
  return localizedName[locale] || Object.values(localizedName)[0] || null
}
