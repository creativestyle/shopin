import { z } from 'zod'
import type { TokenFields } from './login'

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'account.refreshToken.errors.refreshTokenRequired'),
})

export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>

export type RefreshTokenResponse = TokenFields
