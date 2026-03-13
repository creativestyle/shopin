import { z } from 'zod'

export const ResetPasswordRequestSchema = z.object({
  tokenValue: z.string(),
  newPassword: z
    .string()
    .min(8, 'account.resetPassword.errors.newPasswordMinLength'),
})

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>

export const ResetPasswordResponseSchema = z.object({
  success: z.boolean(),
  statusCode: z.number().optional(),
  message: z.string().optional(),
})

export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>
