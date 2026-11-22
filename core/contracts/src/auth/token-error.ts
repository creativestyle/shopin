import { z } from 'zod'

export const AuthTokenErrorSchema = z.enum(['token_expired', 'token_invalid'])

export type AuthTokenError = z.infer<typeof AuthTokenErrorSchema>
