import { RegisterRequestSchema } from '@core/contracts/auth/register'
import { ResetPasswordRequestSchema } from '@core/contracts/auth/reset-password'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@config/constants'
import enUS from '@core/i18n/en-US.json'
import deDE from '@core/i18n/de-DE.json'
import type { ZodType } from 'zod'

function translationAt(messages: object, key: string): unknown {
  return key
    .split('.')
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown> | undefined)?.[part],
      messages
    )
}

function firstError(schema: ZodType, value: string): string | undefined {
  const result = schema.safeParse(value)
  return result.success ? undefined : result.error.issues[0]?.message
}

const FLOWS = [
  {
    name: 'registration',
    schema: RegisterRequestSchema.shape.password,
    keys: {
      minLength: 'account.signUp.errors.passwordMinLength',
      maxLength: 'account.signUp.errors.passwordMaxLength',
      requiresLetter: 'account.signUp.errors.passwordRequiresLetter',
    },
  },
  {
    name: 'password reset',
    schema: ResetPasswordRequestSchema.shape.newPassword,
    keys: {
      minLength: 'account.resetPassword.errors.newPasswordMinLength',
      maxLength: 'account.resetPassword.errors.newPasswordMaxLength',
      requiresLetter: 'account.resetPassword.errors.newPasswordRequiresLetter',
    },
  },
]

describe.each(FLOWS)('$name password schema', ({ schema, keys }) => {
  it('accepts the min and max lengths', () => {
    expect(firstError(schema, 'a'.repeat(PASSWORD_MIN_LENGTH))).toBeUndefined()
    expect(firstError(schema, 'a'.repeat(PASSWORD_MAX_LENGTH))).toBeUndefined()
  })

  it('rejects one character below the min', () => {
    expect(firstError(schema, 'a'.repeat(PASSWORD_MIN_LENGTH - 1))).toBe(
      keys.minLength
    )
  })

  it('rejects one character above the max', () => {
    expect(firstError(schema, 'a'.repeat(PASSWORD_MAX_LENGTH + 1))).toBe(
      keys.maxLength
    )
  })

  it('rejects a password without a letter', () => {
    expect(firstError(schema, '1'.repeat(PASSWORD_MIN_LENGTH))).toBe(
      keys.requiresLetter
    )
  })

  it.each(Object.values(keys))('has %s in en-US and de-DE', (key) => {
    expect(typeof translationAt(enUS, key)).toBe('string')
    expect(typeof translationAt(deDE, key)).toBe('string')
  })
})
