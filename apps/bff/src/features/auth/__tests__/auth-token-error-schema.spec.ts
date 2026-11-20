import { ConfirmEmailResponseSchema } from '@core/contracts/auth/confirm-email'
import { ResetPasswordResponseSchema } from '@core/contracts/auth/reset-password'

describe.each([
  ['ConfirmEmailResponseSchema', ConfirmEmailResponseSchema],
  ['ResetPasswordResponseSchema', ResetPasswordResponseSchema],
])('%s message', (_, schema) => {
  it.each(['token_expired', 'token_invalid'])('accepts %s', (message) => {
    expect(schema.safeParse({ success: false, message }).success).toBe(true)
  })

  it('rejects any other value', () => {
    expect(
      schema.safeParse({ success: false, message: 'token_used' }).success
    ).toBe(false)
  })
})
