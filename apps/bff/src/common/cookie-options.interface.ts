/**
 * Cookie options interface for consistent cookie configuration across services
 */
export interface CookieOptions {
  httpOnly: boolean
  secure: boolean
  sameSite: 'lax' | 'strict' | 'none'
  maxAge: number
  path: string
}
