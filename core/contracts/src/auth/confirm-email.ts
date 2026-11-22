import { z } from 'zod'
import { AuthTokenErrorSchema } from './token-error'

export const ConfirmEmailRequestSchema = z.object({
  tokenValue: z.string(), // Token is required - comes from email link or temporary success page
})

export type ConfirmEmailRequest = z.infer<typeof ConfirmEmailRequestSchema>

export const ConfirmEmailResponseSchema = z.object({
  success: z.boolean(),
  statusCode: z.number().optional(),
  message: AuthTokenErrorSchema.optional(),
})

export type ConfirmEmailResponse = z.infer<typeof ConfirmEmailResponseSchema>
