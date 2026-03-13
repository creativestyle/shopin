import { z } from 'zod'

export const LoginRequestSchema = z.object({
  email: z.email('account.signIn.errors.emailInvalid'),
  password: z.string().min(1, 'account.signIn.errors.passwordRequired'),
})

export type LoginRequest = z.infer<typeof LoginRequestSchema>

export const LoginResponseSchema = z.object({
  success: z.boolean(),
  statusCode: z.number().optional(),
  message: z.string().optional(),
})

export type LoginResponse = z.infer<typeof LoginResponseSchema>

export interface TokenFields {
  accessToken: string
  refreshToken: string
  expiresIn: number
}
