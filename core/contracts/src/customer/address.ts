import { z } from 'zod'
import {
  AddressBaseSchema,
  AddressRequestSchema,
} from '../address/address-base'

/**
 * Extended address schema for responses
 * Inherits validation from AddressBaseSchema
 */
export const AddressResponseSchema = AddressBaseSchema.extend({
  id: z.string().optional(),
})

export type AddressResponse = z.infer<typeof AddressResponseSchema>

export const AddAddressRequestSchema = AddressRequestSchema

export type AddAddressRequest = z.infer<typeof AddAddressRequestSchema>

export const UpdateAddressRequestSchema = AddressRequestSchema.extend({
  id: z.string(),
})

export type UpdateAddressRequest = z.infer<typeof UpdateAddressRequestSchema>

export const AddressesResponseSchema = z.object({
  addresses: z.array(AddressResponseSchema),
  defaultShippingAddressId: z.string().optional(),
  defaultBillingAddressId: z.string().optional(),
  shippingAddressIds: z.array(z.string()).optional(),
  billingAddressIds: z.array(z.string()).optional(),
})

export type AddressesResponse = z.infer<typeof AddressesResponseSchema>
