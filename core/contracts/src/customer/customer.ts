import { z } from 'zod'
import { SALUTATION_OPTIONS } from '@config/constants'
import { createPasswordSchema } from '../core/password'

export const CustomerResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  salutation: z.enum([...SALUTATION_OPTIONS, '']).optional(),
  dateOfBirth: z.string().optional(),
  version: z.number(),
  isEmailVerified: z.boolean().optional(),
})

export type CustomerResponse = z.infer<typeof CustomerResponseSchema>

export const UpdateCustomerRequestSchema = z.object({
  firstName: z
    .string()
    .min(1, 'account.myAccount.customerData.errors.firstNameRequired'),
  lastName: z
    .string()
    .min(1, 'account.myAccount.customerData.errors.lastNameRequired'),
  salutation: z.enum([...SALUTATION_OPTIONS, '']).optional(),
  dateOfBirth: z
    .union([
      z.literal(''), // allow empty string to clear the date
      z.iso.date('account.myAccount.customerData.errors.dateOfBirthInvalid'),
    ])
    .optional(),
})

export type UpdateCustomerRequest = z.infer<typeof UpdateCustomerRequestSchema>

export const ChangeCustomerPasswordRequestSchema = z.object({
  // Only checked for presence: existing passwords predate the rules below and must
  // stay usable for authentication.
  currentPassword: z
    .string()
    .min(1, 'account.myAccount.changePassword.errors.currentPasswordRequired'),
  newPassword: createPasswordSchema({
    minLength: 'account.myAccount.changePassword.errors.newPasswordMinLength',
    maxLength: 'account.myAccount.changePassword.errors.newPasswordMaxLength',
    requiresLetter:
      'account.myAccount.changePassword.errors.newPasswordRequiresLetter',
  }),
})

export type ChangeCustomerPasswordRequest = z.infer<
  typeof ChangeCustomerPasswordRequestSchema
>

/**
 * Machine-readable code the BFF returns (with 401) when `currentPassword` does not
 * match the customer's password. Lets the client tell a wrong password apart from an
 * expired session, which is also a 401 on the same endpoint.
 */
export const INVALID_CURRENT_PASSWORD_CODE = 'INVALID_CURRENT_PASSWORD'
