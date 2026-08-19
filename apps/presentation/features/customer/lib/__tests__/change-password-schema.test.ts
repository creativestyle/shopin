import { ChangeCustomerPasswordRequestSchema } from '@core/contracts/customer/customer'

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
    expect(firstError('Passwort1234567890')).toBeUndefined()
    expect(firstError('grosseäöü')).toBeUndefined()
  })

  it('neither requires nor rejects special characters', () => {
    expect(firstError('haslo123!')).toBeUndefined()
    expect(firstError('haslo 123')).toBeUndefined()
    expect(firstError('p@ssw0rd€')).toBeUndefined()
  })

  it('rejects passwords shorter than 8 characters', () => {
    expect(firstError('haslo12')).toBe(`${ERRORS}.newPasswordMinLength`)
  })

  it('rejects passwords longer than 18 characters', () => {
    expect(firstError('a'.repeat(19))).toBe(`${ERRORS}.newPasswordMaxLength`)
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
})
