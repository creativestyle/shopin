import { z } from 'zod'

export const LogoutRequestSchema = z.object({
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
})

export type LogoutRequest = z.infer<typeof LogoutRequestSchema>
