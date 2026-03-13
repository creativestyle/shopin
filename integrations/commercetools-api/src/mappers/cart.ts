import type {
  CartResponse,
  BillingAddressResponse,
  ShippingAddressResponse,
  LineItemResponse,
} from '@core/contracts/cart/cart'
import { AddressBaseSchema } from '@core/contracts/address/address-base'
import type { LocalizedStringApiResponse } from '../schemas/localized-string'
import { getLocalizedString } from '../helpers/get-localized-string'
import { getLocalizedProductSlug } from '../helpers/get-localized-product-slug'
import { calculateTaxFromCart } from '../helpers/calculate-tax-from-cart'
import { createBasicPrice } from '../helpers/create-basic-price'
import { stringifySelectableAttributeValue } from '../helpers/stringify-selectable-attribute-value'
import type { CartApiResponse } from '../schemas/cart'

const LINE_ITEM_DISPLAY_ATTRIBUTES = ['color', 'size']

/**
 * Maps API address to contract billing address
 * Uses Zod schema to validate address fields including salutation
 */
function mapBillingAddress(
  address: CartApiResponse['billingAddress']
): BillingAddressResponse | undefined {
  if (!address) {
    return undefined
  }

  // Use AddressBaseSchema directly - Zod handles salutation validation via enum
  // Note: isDefaultShipping and isDefaultBilling are automatically excluded since they're not in the API response
  const result = AddressBaseSchema.safeParse(address)
  return result.success ? result.data : undefined
}

/**
 * Maps API address to contract shipping address
 * Uses Zod schema to validate address fields including salutation
 */
function mapShippingAddress(
  address: CartApiResponse['shippingAddress']
): ShippingAddressResponse | undefined {
  if (!address) {
    return undefined
  }

  // Use AddressBaseSchema directly - Zod handles salutation validation via enum
  // Note: isDefaultShipping and isDefaultBilling are automatically excluded since they're not in the API response
  const result = AddressBaseSchema.safeParse(address)
  return result.success ? result.data : undefined
}

/**
 * Maps API line items to contract line items
 */
export function mapLineItems(
  cart: CartApiResponse,
  language: string
): LineItemResponse[] {
  return (
    cart.lineItems?.map((item) => {
      const name =
        getLocalizedString(
          item.name as LocalizedStringApiResponse | undefined,
          language
        ) || 'Unknown Product'

      const price = item.variant?.prices?.[0]
      const regularPriceCents = price?.value.centAmount ?? 0
      const discountedCents = price?.discounted?.value.centAmount
      const currency =
        price?.value.currencyCode ||
        cart.currency ||
        cart.totalPrice.currencyCode

      const productSlug = getLocalizedProductSlug(item.product, language)

      const attributes: Record<string, string> = {}
      for (const attr of item.variant?.attributes ?? []) {
        if (!LINE_ITEM_DISPLAY_ATTRIBUTES.includes(attr.name.toLowerCase())) {
          continue
        }
        const value = stringifySelectableAttributeValue(attr.value, language)
        if (value) {
          attributes[attr.name] = value
        }
      }

      return {
        id: item.id,
        productId: item.productId,
        productSlug,
        variantId: item.variant?.id?.toString(),
        sku: item.variant?.sku,
        quantity: item.quantity,
        price: createBasicPrice(regularPriceCents, {
          currency,
          discountedPriceInCents: discountedCents,
        })!,
        imageUrl: item.variant?.images?.[0]?.url,
        name,
        attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      }
    }) || []
  )
}

/**
 * Calculates subtotal from line items
 * Uses totalPrice if available, otherwise calculates from unit price * quantity
 */
export function calculateLineItemsSubtotal(
  lineItems: CartApiResponse['lineItems']
): number {
  return (
    lineItems?.reduce((sum, item) => {
      if (item.totalPrice) {
        return sum + item.totalPrice.centAmount
      }
      const unitPrice = item.variant?.prices?.[0]?.value.centAmount ?? 0
      return sum + unitPrice * item.quantity
    }, 0) ?? 0
  )
}

/**
 * Calculates subtotal from custom line items
 */
export function calculateCustomLineItemsSubtotal(
  customLineItems: CartApiResponse['customLineItems']
): number {
  return (
    customLineItems?.reduce(
      (sum, item) => sum + item.totalPrice.centAmount,
      0
    ) ?? 0
  )
}

/**
 * Calculates total item count from line items
 */
export function calculateItemCount(lineItems: LineItemResponse[]): number {
  return lineItems.reduce((sum, item) => sum + item.quantity, 0)
}

/**
 * Maps shipping info from API to contract
 * Only maps if shippingMethod is present to ensure we have a valid ID
 */
function mapShippingInfo(
  shippingInfo: CartApiResponse['shippingInfo']
): CartResponse['shippingInfo'] {
  if (!shippingInfo || !shippingInfo.shippingMethod) {
    return undefined
  }

  return {
    shippingMethodId: shippingInfo.shippingMethod.id,
    shippingMethodName: shippingInfo.shippingMethodName,
    price: createBasicPrice(shippingInfo.price.centAmount, {
      currency: shippingInfo.price.currencyCode,
    })!,
  }
}

/**
 * Maps payment info from Payment resources to contract
 * The BFF layer enriches the response by fetching payment details if needed.
 *
 * @param paymentInfo - Payment info from cart API response
 */
export function mapPaymentInfo(
  paymentInfo: CartApiResponse['paymentInfo']
): CartResponse['paymentInfo'] {
  if (!paymentInfo?.payments || paymentInfo.payments.length === 0) {
    return undefined
  }

  // Map payments to flat contract format - merge obj data to top level
  const mappedPayments = paymentInfo.payments.map((payment) => {
    // Use obj data if present (expanded payment), otherwise use top-level data
    const expandedPayment = payment.obj
    const paymentMethodInfo =
      expandedPayment?.paymentMethodInfo ?? payment.paymentMethodInfo
    return {
      typeId: 'payment' as const,
      id: payment.id,
      version: expandedPayment?.version,
      // Prefer obj.paymentMethodInfo if available, fallback to top-level
      // Include localized name from paymentMethodInfo.name
      paymentMethodInfo: paymentMethodInfo
        ? {
            method: paymentMethodInfo.method,
            paymentInterface: paymentMethodInfo.paymentInterface,
            name: paymentMethodInfo.name,
          }
        : undefined,
      transactions: expandedPayment?.transactions?.map((transaction) => ({
        id: transaction.id,
        type: transaction.type,
        amount: {
          centAmount: transaction.amount.centAmount,
          currencyCode: transaction.amount.currencyCode,
        },
        state: transaction.state,
      })),
      amountPlanned: expandedPayment?.amountPlanned,
    }
  })

  return {
    payments: mappedPayments,
  }
}

export function mapCartToResponse(
  cart: CartApiResponse,
  language: string
): CartResponse {
  const lineItems = mapLineItems(cart, language)

  const lineItemsSubtotalCents = calculateLineItemsSubtotal(cart.lineItems)
  const customLineItemsSubtotalCents = calculateCustomLineItemsSubtotal(
    cart.customLineItems
  )
  const subtotalCents = lineItemsSubtotalCents + customLineItemsSubtotalCents

  const taxCents = calculateTaxFromCart(cart)
  const discountCents = cart.discountOnTotalPrice?.discountedAmount.centAmount
  const grandTotalCents =
    cart.taxedPrice?.totalGross.centAmount ?? cart.totalPrice.centAmount

  const currency = cart.currency || cart.totalPrice.currencyCode
  const itemCount = calculateItemCount(lineItems)

  const shippingInfo = mapShippingInfo(cart.shippingInfo)
  const paymentInfo = mapPaymentInfo(cart.paymentInfo)

  return {
    id: cart.id,
    version: cart.version,
    lineItems,
    subtotal: createBasicPrice(subtotalCents, { currency })!,
    tax: createBasicPrice(taxCents, { currency }),
    discountAmount: createBasicPrice(discountCents, { currency }),
    grandTotal: createBasicPrice(grandTotalCents, { currency })!,
    currency,
    itemCount,
    billingAddress: mapBillingAddress(cart.billingAddress),
    shippingAddress: mapShippingAddress(cart.shippingAddress),
    shippingInfo,
    paymentInfo,
  }
}
