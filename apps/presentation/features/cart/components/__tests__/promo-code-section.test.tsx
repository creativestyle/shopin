import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PromoCodeSection } from '../promo-code-section'

const mockApplyCode = jest.fn()
const mockRemoveCode = jest.fn()
let mockFeedback: { type: 'success' | 'error'; message: string } | null = null

jest.mock('next-intl', () => ({
  useTranslations:
    (namespace?: string) => (key: string, values?: Record<string, string>) => {
      const fullKey = namespace ? `${namespace}.${key}` : key
      return values ? `${fullKey}:${Object.values(values).join(',')}` : fullKey
    },
}))

jest.mock('../../hooks/use-promo-code', () => ({
  usePromoCode: () => ({
    applyCode: mockApplyCode,
    removeCode: mockRemoveCode,
    isApplying: false,
    isRemoving: false,
    feedback: mockFeedback,
    clearFeedback: jest.fn(),
  }),
}))

async function openSection(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Promo code' }))
}

describe('PromoCodeSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFeedback = null
    mockApplyCode.mockResolvedValue({ success: true, data: {} })
    mockRemoveCode.mockResolvedValue({ success: true, data: {} })
  })

  it('renders a labelled input and an apply button', async () => {
    const user = userEvent.setup()
    render(<PromoCodeSection label='Promo code' />)
    await openSection(user)

    expect(
      screen.getByRole('textbox', { name: 'cart.promoCode.label' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'cart.promoCode.apply' })
    ).toBeInTheDocument()
  })

  it('applies a trimmed code on submit', async () => {
    const user = userEvent.setup()
    render(<PromoCodeSection label='Promo code' />)
    await openSection(user)

    await user.type(
      screen.getByRole('textbox', { name: 'cart.promoCode.label' }),
      '  SAVE10  '
    )
    await user.click(
      screen.getByRole('button', { name: 'cart.promoCode.apply' })
    )

    expect(mockApplyCode).toHaveBeenCalledWith({ code: 'SAVE10' })
  })

  it('submits on Enter so the form is keyboard-operable', async () => {
    const user = userEvent.setup()
    render(<PromoCodeSection label='Promo code' />)
    await openSection(user)

    await user.type(
      screen.getByRole('textbox', { name: 'cart.promoCode.label' }),
      'SAVE10{Enter}'
    )

    expect(mockApplyCode).toHaveBeenCalledWith({ code: 'SAVE10' })
  })

  it('keeps apply disabled while the input is empty', async () => {
    const user = userEvent.setup()
    render(<PromoCodeSection label='Promo code' />)
    await openSection(user)

    expect(
      screen.getByRole('button', { name: 'cart.promoCode.apply' })
    ).toBeDisabled()
  })

  // Opens without interaction when a code is applied, so the active discount is visible.
  it('shows the applied code and a remove control instead of the input', async () => {
    const user = userEvent.setup()
    render(
      <PromoCodeSection
        label='Promo code'
        appliedCodes={[{ id: 'dc-1', code: 'SAVE10' }]}
      />
    )

    expect(
      screen.getByText('cart.promoCode.applied:SAVE10')
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('textbox', { name: 'cart.promoCode.label' })
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', {
        name: 'cart.promoCode.removeAriaLabel:SAVE10',
      })
    )
    expect(mockRemoveCode).toHaveBeenCalledWith({ discountCodeId: 'dc-1' })
  })

  it('announces an error via an alert region', async () => {
    mockFeedback = { type: 'error', message: 'This code has expired.' }
    const user = userEvent.setup()
    render(<PromoCodeSection label='Promo code' />)
    await openSection(user)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This code has expired.'
    )
  })

  it('announces success via a status region', async () => {
    mockFeedback = { type: 'success', message: 'Promo code applied.' }
    const user = userEvent.setup()
    render(<PromoCodeSection label='Promo code' />)
    await openSection(user)

    expect(screen.getByRole('status')).toHaveTextContent('Promo code applied.')
  })
})
