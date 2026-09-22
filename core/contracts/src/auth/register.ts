import { z } from 'zod'
import { SALUTATION_OPTIONS } from '@config/constants'
import { createPasswordSchema } from '../core/password'

export const RegisterRequestSchema = z.object({
  salutation: z.enum([...SALUTATION_OPTIONS, '']).optional(),
  firstName: z.string().min(1, 'account.signUp.errors.firstNameRequired'),
  lastName: z.string().min(1, 'account.signUp.errors.lastNameRequired'),
  email: z.email('account.signUp.errors.emailInvalid'),
  password: createPasswordSchema({
    minLength: 'account.signUp.errors.passwordMinLength',
    maxLength: 'account.signUp.errors.passwordMaxLength',
    requiresLetter: 'account.signUp.errors.passwordRequiresLetter',
  }),
  dateOfBirth: z
    .union([
      z.literal(''), // allow empty string to clear the date
      z.iso.date('account.signUp.errors.dateOfBirthInvalid'),
    ])
    .optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'account.signUp.errors.acceptTermsRequired',
  }),
})

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>

export const RegisterResponseSchema = z.object({
  success: z.boolean(),
  statusCode: z.number().optional(),
  message: z.string().optional(),
  emailToken: z.string().optional(), // TEMPORARY: Token for email confirmation link
})

export type RegisterResponse = z.infer<typeof RegisterResponseSchema>
