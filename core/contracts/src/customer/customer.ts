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
  /** The platform's version, when it has one. */
  version: z.number().optional(),
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

export const ChangeCustomerEmailRequestSchema = z.object({
  email: z.email('account.myAccount.changeEmail.errors.emailInvalid'),
  currentPassword: z
    .string()
    .min(1, 'account.myAccount.changeEmail.errors.currentPasswordRequired'),
})

export type ChangeCustomerEmailRequest = z.infer<
  typeof ChangeCustomerEmailRequestSchema
>

export const ChangeCustomerEmailResponseSchema = z.object({
  customer: CustomerResponseSchema,
  // TODO: remove once an email service sends the verification mail.
  emailToken: z.string().optional(),
})

export type ChangeCustomerEmailResponse = z.infer<
  typeof ChangeCustomerEmailResponseSchema
>

/**
 * Machine-readable code the BFF returns (with 400) when `currentPassword` does not
 * match the customer's password, so the client can show it on the field.
 */
export const INVALID_CURRENT_PASSWORD_CODE = 'INVALID_CURRENT_PASSWORD'

/** Machine-readable code the BFF returns (with 409) when the new email is taken. */
export const EMAIL_IN_USE_CODE = 'EMAIL_IN_USE'

/** Machine-readable code the BFF returns (with 400) when the new email is the current one. */
export const EMAIL_UNCHANGED_CODE = 'EMAIL_UNCHANGED'
