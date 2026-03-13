import { z } from 'zod'
import { SALUTATION_OPTIONS } from '@config/constants'

export const AddLineItemActionSchema = z.object({
  action: z.literal('addLineItem'),
  productId: z.string(),
  variantId: z.number().int().positive().optional(),
  quantity: z.number().int().positive(),
})

export const ChangeLineItemQuantityActionSchema = z.object({
  action: z.literal('changeLineItemQuantity'),
  lineItemId: z.string(),
  quantity: z.number().int().positive(),
})

export const RemoveLineItemActionSchema = z.object({
  action: z.literal('removeLineItem'),
  lineItemId: z.string(),
})

export const SetBillingAddressActionSchema = z.object({
  action: z.literal('setBillingAddress'),
  address: z.object({
    salutation: z.enum([...SALUTATION_OPTIONS, '']).optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    streetName: z.string().optional(),
    streetNumber: z.string().optional(),
    additionalStreetInfo: z.string().optional(),
    postalCode: z.string().optional(),
    city: z.string().optional(),
    country: z.string(),
    email: z.email().optional(),
  }),
})

export const SetShippingAddressActionSchema = z.object({
  action: z.literal('setShippingAddress'),
  address: z.object({
    salutation: z.enum([...SALUTATION_OPTIONS, '']).optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    streetName: z.string().optional(),
    streetNumber: z.string().optional(),
    additionalStreetInfo: z.string().optional(),
    postalCode: z.string().optional(),
    city: z.string().optional(),
    country: z.string(),
    email: z.email().optional(),
  }),
})

export const SetShippingMethodActionSchema = z.object({
  action: z.literal('setShippingMethod'),
  shippingMethod: z
    .object({
      typeId: z.literal('shipping-method'),
      id: z.string(),
    })
    .optional(),
  // Keep shippingMethodId for backward compatibility, but prefer shippingMethod
  shippingMethodId: z.string().optional(),
})

export const RecalculateCartActionSchema = z.object({
  action: z.literal('recalculate'),
  updateProductData: z.boolean().optional(),
})

export const SetCustomFieldActionSchema = z.object({
  action: z.literal('setCustomField'),
  name: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
})

export const AddPaymentActionSchema = z.object({
  action: z.literal('addPayment'),
  payment: z.object({
    typeId: z.literal('payment'),
    id: z.string(),
  }),
})

export const RemovePaymentActionSchema = z.object({
  action: z.literal('removePayment'),
  payment: z.object({
    typeId: z.literal('payment'),
    id: z.string(),
  }),
})

export const CartUpdateActionSchema = z.discriminatedUnion('action', [
  AddLineItemActionSchema,
  ChangeLineItemQuantityActionSchema,
  RemoveLineItemActionSchema,
  SetBillingAddressActionSchema,
  SetShippingAddressActionSchema,
  SetShippingMethodActionSchema,
  RecalculateCartActionSchema,
  SetCustomFieldActionSchema,
  AddPaymentActionSchema,
  RemovePaymentActionSchema,
])

export type CartUpdateAction = z.infer<typeof CartUpdateActionSchema>
