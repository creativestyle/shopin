import { z } from 'zod'

export const ConfirmEmailRequestSchema = z.object({
  tokenValue: z.string(), // Token is required - comes from email link or temporary success page
})

export type ConfirmEmailRequest = z.infer<typeof ConfirmEmailRequestSchema>

export const ConfirmEmailResponseSchema = z.object({
  success: z.boolean(),
  alreadyVerified: z.boolean().optional(),
  statusCode: z.number().optional(),
  message: z.string().optional(),
})

export type ConfirmEmailResponse = z.infer<typeof ConfirmEmailResponseSchema>
