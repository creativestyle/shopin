import { z } from 'zod'
import { createPasswordSchema } from '../core/password'

export const ResetPasswordRequestSchema = z.object({
  tokenValue: z.string(),
  newPassword: createPasswordSchema({
    minLength: 'account.resetPassword.errors.newPasswordMinLength',
    maxLength: 'account.resetPassword.errors.newPasswordMaxLength',
    requiresLetter: 'account.resetPassword.errors.newPasswordRequiresLetter',
  }),
})

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>

export const ResetPasswordResponseSchema = z.object({
  success: z.boolean(),
  statusCode: z.number().optional(),
  message: z.string().optional(),
})

export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>
