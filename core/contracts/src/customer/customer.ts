import { z } from 'zod'
import { SALUTATION_OPTIONS } from '@config/constants'

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
      z.iso.date(),
    ])
    .optional(),
})

export type UpdateCustomerRequest = z.infer<typeof UpdateCustomerRequestSchema>

export const ChangeCustomerPasswordRequestSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'account.myAccount.changePassword.errors.currentPasswordRequired'),
  newPassword: z
    .string()
    .min(8, 'account.myAccount.changePassword.errors.newPasswordMinLength'),
})

export type ChangeCustomerPasswordRequest = z.infer<
  typeof ChangeCustomerPasswordRequestSchema
>
