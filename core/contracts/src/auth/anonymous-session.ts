import { z } from 'zod'

export const AnonymousSessionResponseSchema = z.object({
  success: z.boolean(),
  statusCode: z.number().optional(),
})

export type AnonymousSessionResponse = z.infer<
  typeof AnonymousSessionResponseSchema
>

export interface AnonymousSessionTokenFields {
  accessToken: string
  refreshToken: string
  expiresIn: number
}
