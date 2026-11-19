import { ChangeCustomerPasswordRequestSchema } from '@core/contracts/customer/customer'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@config/constants'
import enUS from '@core/i18n/en-US.json'
import deDE from '@core/i18n/de-DE.json'

function translationAt(messages: object, key: string): unknown {
  return key
    .split('.')
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown> | undefined)?.[part],
      messages
    )
}

function firstError(newPassword: string): string | undefined {
  const result = ChangeCustomerPasswordRequestSchema.safeParse({
    currentPassword: 'anything',
    newPassword,
  })
  return result.success ? undefined : result.error.issues[0]?.message
}

const ERRORS = 'account.myAccount.changePassword.errors'

describe('ChangeCustomerPasswordRequestSchema', () => {
  it('accepts a password matching the stated rules', () => {
    expect(firstError('haslo123')).toBeUndefined()
    expect(firstError('a'.repeat(PASSWORD_MIN_LENGTH))).toBeUndefined()
    expect(firstError('a'.repeat(PASSWORD_MAX_LENGTH))).toBeUndefined()
    expect(firstError('grosseäöü')).toBeUndefined()
  })

  it('neither requires nor rejects special characters', () => {
    expect(firstError('haslo123!')).toBeUndefined()
    expect(firstError('haslo 123')).toBeUndefined()
    expect(firstError('p@ssw0rd€')).toBeUndefined()
  })

  it('rejects passwords shorter than the min', () => {
    expect(firstError('a'.repeat(PASSWORD_MIN_LENGTH - 1))).toBe(
      `${ERRORS}.newPasswordMinLength`
    )
  })

  it('rejects passwords longer than the max', () => {
    expect(firstError('a'.repeat(PASSWORD_MAX_LENGTH + 1))).toBe(
      `${ERRORS}.newPasswordMaxLength`
    )
  })

  it('rejects passwords without a letter', () => {
    expect(firstError('12345678')).toBe(`${ERRORS}.newPasswordRequiresLetter`)
  })

  it('only requires the current password to be present, whatever it contains', () => {
    const legacy = ChangeCustomerPasswordRequestSchema.safeParse({
      currentPassword: 'a-very-long-legacy-password-without-symbols',
      newPassword: 'haslo123!',
    })
    expect(legacy.success).toBe(true)

    const missing = ChangeCustomerPasswordRequestSchema.safeParse({
      currentPassword: '',
      newPassword: 'haslo123!',
    })
    expect(missing.success).toBe(false)
    expect(missing.error?.issues[0]?.message).toBe(
      `${ERRORS}.currentPasswordRequired`
    )
  })

  it.each([
    `${ERRORS}.newPasswordMinLength`,
    `${ERRORS}.newPasswordMaxLength`,
    `${ERRORS}.newPasswordRequiresLetter`,
    `${ERRORS}.wrongCurrentPassword`,
    'account.passwordHint',
  ])('has %s in en-US and de-DE', (key) => {
    expect(typeof translationAt(enUS, key)).toBe('string')
    expect(typeof translationAt(deDE, key)).toBe('string')
  })
})
