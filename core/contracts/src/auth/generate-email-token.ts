import { z } from 'zod'

export const GenerateEmailTokenRequestSchema = z.object({
  email: z.email(),
})

export type GenerateEmailTokenRequest = z.infer<
  typeof GenerateEmailTokenRequestSchema
>

export const GenerateEmailTokenResponseSchema = z.object({
  emailToken: z.string().optional(),
})

export type GenerateEmailTokenResponse = z.infer<
  typeof GenerateEmailTokenResponseSchema
>
