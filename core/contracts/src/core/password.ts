import { z } from 'zod'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@config/constants'

/** ICU values for the password hint and length error messages. */
export const PASSWORD_RULE_VALUES = {
  min: PASSWORD_MIN_LENGTH,
  max: PASSWORD_MAX_LENGTH,
}

interface PasswordErrorKeys {
  minLength: string
  maxLength: string
  requiresLetter: string
}

/**
 * Password rules shared by registration, password reset and password change:
 * PASSWORD_MIN_LENGTH-PASSWORD_MAX_LENGTH characters with at least one letter.
 * Special characters are neither required nor rejected. Each flow passes its own
 * translation keys.
 */
export function createPasswordSchema(errorKeys: PasswordErrorKeys) {
  return z
    .string()
    .min(PASSWORD_MIN_LENGTH, errorKeys.minLength)
    .max(PASSWORD_MAX_LENGTH, errorKeys.maxLength)
    .regex(/\p{L}/u, errorKeys.requiresLetter)
}
