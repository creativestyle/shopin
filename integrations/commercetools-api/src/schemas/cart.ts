import { z } from 'zod'
import { SALUTATION_OPTIONS } from '@config/constants'
import { LocalizedStringApiResponseSchema } from './localized-string'
import { ProductVariantApiResponseSchema } from './product-variant'

const TypedMoneyApiResponseSchema = z.object({
  centAmount: z.number(),
  currencyCode: z.string(),
})

export const CartLineItemVariantApiResponseSchema =
  ProductVariantApiResponseSchema.extend({
    images: z
      .array(
        z.object({
          url: z.string(),
        })
      )
      .optional(),
    prices: z
      .array(
        z.object({
          value: z.object({
            centAmount: z.number(),
            currencyCode: z.string(),
          }),
          discounted: z
            .object({
              value: z.object({
                centAmount: z.number(),
              }),
            })
            .optional(),
        })
      )
      .optional(),
  })

export const CartLineItemProductApiResponseSchema = z.object({
  id: z.string(),
  masterData: z
    .object({
      current: z
        .object({
          slug: LocalizedStringApiResponseSchema.optional(),
        })
        .optional(),
    })
    .optional(),
  productType: z
    .object({
      obj: z
        .object({
          attributes: z
            .array(
              z.object({
                name: z.string(),
                type: z.object({
                  name: z.string(),
                }),
                isRequired: z.boolean().optional(),
                attributeConstraint: z.string().optional(),
              })
            )
            .optional(),
        })
        .optional(),
    })
    .optional(),
})

export const CartLineItemApiResponseSchema = z.object({
  id: z.string(),
  productId: z.string(),
  variantId: z.number().optional(),
  quantity: z.number().int().positive(),
  name: LocalizedStringApiResponseSchema.optional(),
  product: CartLineItemProductApiResponseSchema.optional(),
  variant: CartLineItemVariantApiResponseSchema.optional(),
  totalPrice: TypedMoneyApiResponseSchema.optional(),
})

const AddressApiResponseSchema = z.object({
  salutation: z.enum([...SALUTATION_OPTIONS, '']).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  streetName: z.string().optional(),
  streetNumber: z.string().optional(),
  additionalStreetInfo: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  email: z.string().optional(),
})

const ShippingInfoApiResponseSchema = z
  .object({
    shippingMethodName: z.string(),
    price: TypedMoneyApiResponseSchema,
    shippingMethod: z
      .object({
        typeId: z.literal('shipping-method'),
        id: z.string(),
      })
      .optional(),
  })
  .optional()

const CustomLineItemApiResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  totalPrice: TypedMoneyApiResponseSchema,
})

const CustomFieldsApiResponseSchema = z
  .object({
    type: z
      .object({
        typeId: z.literal('type'),
        id: z.string(),
      })
      .optional(),
    fields: z.record(z.string(), z.unknown()).optional(),
  })
  .optional()

const PaymentSchema = z.object({
  typeId: z.literal('payment'),
  id: z.string(),
  paymentMethodInfo: z
    .object({
      method: z.string().optional(),
      paymentInterface: z.string().optional(),
      name: LocalizedStringApiResponseSchema.optional(),
    })
    .optional(),
  obj: z
    .object({
      version: z.number(),
      transactions: z
        .array(
          z.object({
            id: z.string(),
            type: z.string(),
            amount: TypedMoneyApiResponseSchema,
            state: z.string(),
          })
        )
        .optional(),
      paymentMethodInfo: z
        .object({
          method: z.string().optional(),
          paymentInterface: z.string().optional(),
          name: LocalizedStringApiResponseSchema.optional(),
        })
        .optional(),
      amountPlanned: TypedMoneyApiResponseSchema.optional(),
    })
    .optional(),
})

const PaymentInfoApiResponseSchema = z
  .object({
    payments: z.array(PaymentSchema).optional(),
  })
  .optional()

export const CartApiResponseSchema = z.object({
  id: z.string(),
  version: z.number(),
  lineItems: z.array(CartLineItemApiResponseSchema).optional(),
  customLineItems: z.array(CustomLineItemApiResponseSchema).optional(),
  totalPrice: TypedMoneyApiResponseSchema,
  taxedPrice: z
    .object({
      totalGross: TypedMoneyApiResponseSchema,
      totalNet: TypedMoneyApiResponseSchema,
    })
    .optional(),
  discountOnTotalPrice: z
    .object({
      discountedAmount: TypedMoneyApiResponseSchema,
    })
    .optional(),
  currency: z.string().optional(),
  billingAddress: AddressApiResponseSchema.optional(),
  shippingAddress: AddressApiResponseSchema.optional(),
  shippingInfo: ShippingInfoApiResponseSchema,
  paymentInfo: PaymentInfoApiResponseSchema,
  custom: CustomFieldsApiResponseSchema,
})

export type CartApiResponse = z.infer<typeof CartApiResponseSchema>
export type CartLineItemApiResponse = z.infer<
  typeof CartLineItemApiResponseSchema
>
export type CartLineItemVariantApiResponse = z.infer<
  typeof CartLineItemVariantApiResponseSchema
>
export type CartLineItemProductApiResponse = z.infer<
  typeof CartLineItemProductApiResponseSchema
>
