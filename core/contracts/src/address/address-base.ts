import { z } from 'zod'
import { SALUTATION_OPTIONS } from '@config/constants'

/**
 * Address type - single source of truth for address type values
 * Used across checkout flows to distinguish between billing and shipping addresses
 */
export type AddressType = 'billing' | 'shipping'

/**
 * Base address schema - single source of truth for core address fields
 * Used across account and billing/checkout flows
 *
 * This schema defines the essential address fields that are shared across
 * all address-related contracts in the application.
 *
 * All fields are optional with validation error messages using the 'address.errors' translation namespace.
 * Validation messages are applied when values are provided.
 */
export const AddressBaseSchema = z.object({
  salutation: z
    .enum([...SALUTATION_OPTIONS, ''], {
      message: 'address.errors.salutationRequired',
    })
    .optional(),
  firstName: z.string().min(1, 'address.errors.firstNameRequired').optional(),
  lastName: z.string().min(1, 'address.errors.lastNameRequired').optional(),
  streetName: z.string().min(1, 'address.errors.streetNameRequired').optional(),
  streetNumber: z
    .string()
    .min(1, 'address.errors.streetNumberRequired')
    .optional(),
  additionalStreetInfo: z.string().optional(),
  postalCode: z.string().min(1, 'address.errors.postalCodeRequired').optional(),
  city: z.string().min(1, 'address.errors.cityRequired').optional(),
  country: z.string().min(2, 'address.errors.countryRequired').optional(),
  email: z
    .union([
      z.literal(''), // allow empty string to be used as email
      z.email('address.errors.emailInvalid'),
    ])
    .optional(),
  isDefaultShipping: z.boolean().optional(),
  isDefaultBilling: z.boolean().optional(),
})

export type AddressBase = z.infer<typeof AddressBaseSchema>

/**
 * Address request schema with required fields
 * Used for both customer addresses and billing addresses
 */
export const AddressRequestSchema = AddressBaseSchema.required({
  firstName: true,
  lastName: true,
  email: true,
  country: true,
  streetName: true,
  postalCode: true,
  city: true,
})

export type AddressRequest = z.infer<typeof AddressRequestSchema>
