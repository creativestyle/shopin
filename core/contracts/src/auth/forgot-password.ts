import { z } from 'zod'

export const ForgotPasswordRequestSchema = z.object({
  email: z.email('account.forgotPassword.errors.emailInvalid'),
})

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>

export const ForgotPasswordResponseSchema = z.object({
  success: z.boolean(),
  passwordResetToken: z.string().optional(), // TEMPORARY: Token for password reset link
  statusCode: z.number().optional(),
  message: z.string().optional(),
})

export type ForgotPasswordResponse = z.infer<
  typeof ForgotPasswordResponseSchema
>
