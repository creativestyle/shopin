import { z } from 'zod'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@config/constants'

interface PasswordErrorKeys {
  minLength: string
  maxLength: string
  requiresLetter: string
}

/**
 * Password rules shared by registration, password reset and password change:
 * 8-18 characters with at least one letter. Special characters are neither required
 * nor rejected. Each flow passes its own translation keys.
 */
export function createPasswordSchema(errorKeys: PasswordErrorKeys) {
  return z
    .string()
    .min(PASSWORD_MIN_LENGTH, errorKeys.minLength)
    .max(PASSWORD_MAX_LENGTH, errorKeys.maxLength)
    .regex(/\p{L}/u, errorKeys.requiresLetter)
}
