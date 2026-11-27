import type {
  CartResponse,
  BillingAddressResponse,
  ShippingAddressResponse,
  LineItemResponse,
  DiscountCodeResponse,
  LineItemVariantAttributeResponse,
} from '@core/contracts/cart/cart'
import { AddressBaseSchema } from '@core/contracts/address/address-base'
import type { LocalizedStringApiResponse } from '../schemas/localized-string'
import { SHIPPING_METHOD_DELIVERY_TIME_FIELD } from '../schemas/shipping-method-custom'
import { getLocalizedString } from '../helpers/get-localized-string'
import { getLocalizedProductSlug } from '../helpers/get-localized-product-slug'
import { calculateTaxFromCart } from '../helpers/calculate-tax-from-cart'
import { createBasicPrice } from '../helpers/create-basic-price'
import { stringifySelectableAttributeValue } from '../helpers/stringify-selectable-attribute-value'
import type { CartApiResponse } from '../schemas/cart'
import { mapVariantsToShopin } from './variants'
import { parseColorPair } from '../helpers/color-utils'

const LINE_ITEM_DISPLAY_ATTRIBUTES = ['color', 'size']

type CartLineItemApiResponse = NonNullable<CartApiResponse['lineItems']>[number]

// Selectable attributes that differ across the expanded product's variants
function mapLineItemVariantAttributes(
  item: CartLineItemApiResponse,
  language: string
): LineItemVariantAttributeResponse[] | undefined {
  const product = item.product?.masterData?.current
  const defs = item.product?.productType?.obj?.attributes
  if (!product?.masterVariant || !defs || !item.variant) {
    return undefined
  }

  const defsByName = Object.fromEntries(defs.map((d) => [d.name, d]))
  const variantId = String(item.variant.id)
  const variantAttributes =
    mapVariantsToShopin(
      [product.masterVariant, ...(product.variants ?? [])],
      language,
      defsByName
    ).find((v) => v.id === variantId)?.attributes ?? {}

  return Object.entries(variantAttributes)
    .filter(([, value]) => value)
    .map(([name, value]) => ({
      name,
      label: getLocalizedString(defsByName[name]?.label, language) ?? name,
      value: parseColorPair(value)?.label ?? value,
    }))
}

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

      const price = item.price
      const regularPriceCents = price?.value.centAmount ?? 0
      const discountedCents = price?.discounted?.value.centAmount
      const currency = price?.value.currencyCode ?? cart.totalPrice.currencyCode

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
      const variantAttributes = mapLineItemVariantAttributes(item, language)

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
        variantAttributes: variantAttributes?.length
          ? variantAttributes
          : undefined,
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
      const unitPrice = item.price?.value.centAmount ?? 0
      return sum + unitPrice * item.quantity
    }, 0) ?? 0
  )
}

/** Sum of cart discounts CT has already deducted from line item totals. */
export function calculateLineItemsDiscount(
  lineItems: CartApiResponse['lineItems']
): number {
  return (
    lineItems?.reduce(
      (sum, item) =>
        sum +
        // Without totalPrice the subtotal falls back to undiscounted prices.
        (item.totalPrice ? (item.discountedPricePerQuantity ?? []) : []).reduce(
          (itemSum, entry) =>
            itemSum +
            entry.quantity *
              entry.discountedPrice.includedDiscounts.reduce(
                (unitSum, discount) =>
                  unitSum + discount.discountedAmount.centAmount,
                0
              ),
          0
        ),
      0
    ) ?? 0
  )
}

/** Shipping saving from a cart discount; the shipping row keeps showing the full price. */
export function calculateShippingDiscount(
  shippingInfo: CartApiResponse['shippingInfo']
): number {
  if (!shippingInfo?.discountedPrice) {
    return 0
  }
  return Math.max(
    0,
    shippingInfo.price.centAmount -
      shippingInfo.discountedPrice.value.centAmount
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
  shippingInfo: CartApiResponse['shippingInfo'],
  language: string
): CartResponse['shippingInfo'] {
  if (!shippingInfo || !shippingInfo.shippingMethod) {
    return undefined
  }

  return {
    shippingMethodId: shippingInfo.shippingMethod.id,
    shippingMethodName: shippingInfo.shippingMethodName,
    deliveryTime: getLocalizedString(
      shippingInfo.shippingMethod.obj?.custom?.fields?.[
        SHIPPING_METHOD_DELIVERY_TIME_FIELD
      ],
      language
    ),
    price: createBasicPrice(shippingInfo.price.centAmount, {
      currency: shippingInfo.price.currencyCode,
    })!,
  }
}

/**
 * The cart's payment as SHOPin's flat summary: its first payment's method, the payment interface handling it, the
 * localized name, the amount, and a status from its transactions (a successful charge: paid; a successful
 * authorization: authorized; a failure: failed; otherwise pending). Needs `paymentInfo.payments[*]` expanded for the
 * status and amount; without it the summary says pending.
 */
export function mapPaymentInfo(
  paymentInfo: CartApiResponse['paymentInfo']
): CartResponse['paymentInfo'] {
  const payment = paymentInfo?.payments?.[0]
  if (!payment) {
    return undefined
  }
  const expanded = payment.obj
  const info = expanded?.paymentMethodInfo ?? payment.paymentMethodInfo
  const transactions = expanded?.transactions ?? []
  const succeeded = (type: string) =>
    transactions.some((t) => t.type === type && t.state === 'Success')
  const status = succeeded('Charge')
    ? 'paid'
    : succeeded('Authorization')
      ? 'authorized'
      : transactions.some((t) => t.state === 'Failure')
        ? 'failed'
        : 'pending'
  const planned = expanded?.amountPlanned
  return {
    method: info?.method ?? '',
    provider: info?.paymentInterface ?? '',
    ...(info?.name ? { name: info.name } : {}),
    status,
    ...(planned
      ? {
          amount: {
            regularPriceInCents: planned.centAmount,
            currency: planned.currencyCode,
            fractionDigits: planned.fractionDigits ?? 2,
          },
        }
      : {}),
  }
}

/** Needs `discountCodes[*].discountCode` expanded; CT returns only a reference id otherwise. */
export function mapDiscountCodes(
  discountCodes: CartApiResponse['discountCodes']
): DiscountCodeResponse[] | undefined {
  if (!discountCodes?.length) {
    return undefined
  }

  const mapped = discountCodes.flatMap((info) => {
    const code = info.discountCode.obj?.code
    return code
      ? [
          {
            id: info.discountCode.id,
            code,
            applied: info.state === 'MatchesCart',
          },
        ]
      : []
  })

  return mapped.length > 0 ? mapped : undefined
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
  // Line item totals are net of cart discounts; add them back so subtotal − discount + shipping = total.
  const lineItemsDiscountCents = calculateLineItemsDiscount(cart.lineItems)
  const subtotalCents =
    lineItemsSubtotalCents +
    lineItemsDiscountCents +
    customLineItemsSubtotalCents

  const taxCents = calculateTaxFromCart(cart)
  const totalDiscountCents =
    lineItemsDiscountCents +
    calculateShippingDiscount(cart.shippingInfo) +
    (cart.discountOnTotalPrice?.discountedAmount.centAmount ?? 0)
  const discountCents = totalDiscountCents > 0 ? totalDiscountCents : undefined
  const grandTotalCents =
    cart.taxedPrice?.totalGross.centAmount ?? cart.totalPrice.centAmount

  const currency = cart.totalPrice.currencyCode
  const itemCount = calculateItemCount(lineItems)

  const shippingInfo = mapShippingInfo(cart.shippingInfo, language)
  const paymentInfo = mapPaymentInfo(cart.paymentInfo)

  return {
    id: cart.id,
    version: cart.version,
    lineItems,
    subtotal: createBasicPrice(subtotalCents, { currency })!,
    tax: createBasicPrice(taxCents, { currency }),
    discountAmount: createBasicPrice(discountCents, { currency }),
    discountCodes: mapDiscountCodes(cart.discountCodes),
    grandTotal: createBasicPrice(grandTotalCents, { currency })!,
    currency,
    itemCount,
    billingAddress: mapBillingAddress(cart.billingAddress),
    shippingAddress: mapShippingAddress(cart.shippingAddress),
    shippingInfo,
    paymentInfo,
  }
}
