import { z } from 'zod'

export const ResendVerificationEmailRequestSchema = z.object({
  email: z.email(),
})

export type ResendVerificationEmailRequest = z.infer<
  typeof ResendVerificationEmailRequestSchema
>

export const ResendVerificationEmailResponseSchema = z.object({
  success: z.boolean(),
  // TODO: remove emailToken once email service is configured.
  emailToken: z.string().optional(),
  statusCode: z.number().optional(),
  message: z.string().optional(),
})

export type ResendVerificationEmailResponse = z.infer<
  typeof ResendVerificationEmailResponseSchema
>
