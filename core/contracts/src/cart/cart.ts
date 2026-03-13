import { z } from 'zod'
import { BasicPriceResponseSchema } from '../core/basic-price'
import {
  AddressBaseSchema,
  AddressRequestSchema,
} from '../address/address-base'

export const LineItemResponseSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productSlug: z.string().optional(),
  variantId: z.string().optional(),
  sku: z.string().optional(),
  quantity: z.number().int().positive(),
  price: BasicPriceResponseSchema,
  name: z.string(),
  imageUrl: z.string().optional(),
  attributes: z.record(z.string(), z.string()).optional(),
})

export type LineItemResponse = z.infer<typeof LineItemResponseSchema>

/**
 * Billing address schema for cart - uses base address schema
 */
const BillingAddressResponseSchema = AddressBaseSchema

/**
 * Shipping address schema for cart - uses base address schema
 */
const ShippingAddressResponseSchema = AddressBaseSchema

export const ShippingInfoResponseSchema = z
  .object({
    shippingMethodId: z.string(),
    shippingMethodName: z.string().min(1),
    price: BasicPriceResponseSchema,
    freeAbove: BasicPriceResponseSchema.optional(),
  })
  .optional()

export const PaymentInfoResponseSchema = z
  .object({
    // Payments array - flat structure with all payment data at top level
    payments: z
      .array(
        z.object({
          typeId: z.literal('payment'),
          id: z.string(),
          version: z.number().optional(),
          paymentMethodInfo: z
            .object({
              method: z.string().optional(),
              paymentInterface: z.string().optional(),
              name: z.record(z.string(), z.string()).optional(),
            })
            .optional(),
          transactions: z
            .array(
              z.object({
                id: z.string(),
                type: z.string(),
                amount: z.object({
                  centAmount: z.number(),
                  currencyCode: z.string(),
                }),
                state: z.string(),
              })
            )
            .optional(),
          amountPlanned: z
            .object({
              centAmount: z.number(),
              currencyCode: z.string(),
            })
            .optional(),
        })
      )
      .optional(),
  })
  .optional()

export type PaymentInfoResponse = z.infer<typeof PaymentInfoResponseSchema>

export const CartResponseSchema = z.object({
  id: z.string(),
  version: z.number(),
  lineItems: z.array(LineItemResponseSchema),
  subtotal: BasicPriceResponseSchema,
  tax: BasicPriceResponseSchema.optional(),
  discountAmount: BasicPriceResponseSchema.optional(),
  grandTotal: BasicPriceResponseSchema,
  currency: z.string(),
  itemCount: z.number().int().nonnegative(),
  billingAddress: BillingAddressResponseSchema.optional(),
  shippingAddress: ShippingAddressResponseSchema.optional(),
  shippingInfo: ShippingInfoResponseSchema,
  paymentInfo: PaymentInfoResponseSchema,
})

export type BillingAddressResponse = z.infer<
  typeof BillingAddressResponseSchema
>

export type ShippingAddressResponse = z.infer<
  typeof ShippingAddressResponseSchema
>

export type CartResponse = z.infer<typeof CartResponseSchema>

export const AddToCartRequestSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().positive().default(1),
})

export type AddToCartRequest = z.infer<typeof AddToCartRequestSchema>

export const UpdateCartItemRequestSchema = z.object({
  lineItemId: z.string(),
  quantity: z.number().int().positive(),
})

export type UpdateCartItemRequest = z.infer<typeof UpdateCartItemRequestSchema>

export const RemoveCartItemRequestSchema = z.object({
  lineItemId: z.string(),
})

export type RemoveCartItemRequest = z.infer<typeof RemoveCartItemRequestSchema>

/**
 * Set billing address request schema - excludes isDefaultShipping and isDefaultBilling
 * as these fields are only relevant for customer addresses, not cart billing addresses
 */
export const SetBillingAddressRequestSchema = AddressRequestSchema.omit({
  isDefaultShipping: true,
  isDefaultBilling: true,
})

export type SetBillingAddressRequest = z.infer<
  typeof SetBillingAddressRequestSchema
>

/**
 * Set shipping address request schema - excludes isDefaultShipping and isDefaultBilling
 * as these fields are only relevant for customer addresses, not cart shipping addresses
 */
export const SetShippingAddressRequestSchema = AddressRequestSchema.omit({
  isDefaultShipping: true,
  isDefaultBilling: true,
})

export type SetShippingAddressRequest = z.infer<
  typeof SetShippingAddressRequestSchema
>
