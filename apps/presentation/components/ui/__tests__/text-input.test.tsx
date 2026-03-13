import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TextInput } from '../inputs/text-input'
import { PasswordInput } from '../inputs/password-input'
import { DateInput } from '../inputs/date-input'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string) => {
    const translations: Record<string, string> = {
      'common.showPassword': 'Passwort anzeigen',
      'common.hidePassword': 'Passwort ausblenden',
    }
    const fullKey = namespace ? `${namespace}.${key}` : key
    return translations[fullKey] || fullKey
  },
}))

describe('TextInput', () => {
  describe('Basic rendering and props', () => {
    it('renders input with label', () => {
      render(
        <TextInput
          id='lastName'
          label='Nachname'
        />
      )

      const input = screen.getByRole('textbox', { name: 'Nachname' })
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('id', 'lastName')
      expect(input).toHaveAttribute('data-slot', 'input')
    })

    it('applies custom className to input', () => {
      render(
        <TextInput
          id='custom'
          label='Custom'
          className='custom-class'
        />
      )

      const input = screen.getByRole('textbox', { name: 'Custom' })
      expect(input).toHaveClass('custom-class')
    })

    it('sets required attribute correctly', () => {
      render(
        <TextInput
          id='email'
          label='E-Mail'
          required
          validationState='error'
        />
      )

      const input = screen.getByRole('textbox', { name: 'E-Mail' })
      expect(input).toHaveAttribute('aria-required', 'true')
    })

    it('renders disabled state', () => {
      render(
        <TextInput
          id='disabled'
          label='Disabled'
          disabled
        />
      )

      const input = screen.getByRole('textbox', {
        name: 'Disabled',
      }) as HTMLInputElement
      expect(input.disabled).toBe(true)
    })

    it('valid state shows positive icon (aria-hidden) and adds pr-12 padding', () => {
      render(
        <TextInput
          id='valid'
          label='Nachname'
          validationState='valid'
          defaultValue='Mus'
        />
      )

      const input = screen.getByRole('textbox', { name: 'Nachname' })
      expect(input).toHaveClass('pr-12')

      const icon = input.parentElement?.querySelector('svg[aria-hidden="true"]')
      expect(icon).toBeInTheDocument()
    })
  })
})

describe('PasswordInput', () => {
  it('toggles visibility and updates aria-label from translations', async () => {
    const user = userEvent.setup()

    render(
      <PasswordInput
        id='pwd'
        label='Passwort'
      />
    )

    const input = screen.getByLabelText('Passwort') as HTMLInputElement
    const toggle = screen.getByRole('button', { name: 'Passwort anzeigen' })

    expect(input.type).toBe('password')

    await user.click(toggle)

    // After click, aria-label should switch to hide variant
    expect(
      screen.getByRole('button', { name: 'Passwort ausblenden' })
    ).toBeInTheDocument()
    // And input type should be text (visible)
    expect(input.type).toBe('text')
  })
})

describe('DateInput', () => {
  it('renders masked input and calls onChange with masked value', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()

    render(
      <DateInput
        id='dob'
        label='Geburtstag'
        onChange={handleChange}
      />
    )

    const input = screen.getByRole('textbox', {
      name: 'Geburtstag',
    }) as HTMLInputElement
    expect(input).toHaveAttribute('placeholder', 'dd-mm-yyyy')

    await user.type(input, '08-03-2024')

    expect(handleChange).toHaveBeenCalled()
    const lastCall =
      handleChange.mock.calls[handleChange.mock.calls.length - 1][0]
    expect(lastCall.target.value).toBe('08-03-2024')
  })

  it('ignores non-numeric characters', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()

    render(
      <DateInput
        id='dob2'
        label='Geburtstag'
        onChange={handleChange}
      />
    )

    const input = screen.getByRole('textbox', {
      name: 'Geburtstag',
    }) as HTMLInputElement

    await user.type(input, 'ab$%')

    // IMask should prevent invalid characters from changing value
    expect(input).toHaveValue('')
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('sanitizes mixed input to digits and separators only', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()

    render(
      <DateInput
        id='dob3'
        label='Geburtstag'
        onChange={handleChange}
      />
    )

    const input = screen.getByRole('textbox', {
      name: 'Geburtstag',
    }) as HTMLInputElement

    await user.type(input, '08a-0b3-20x24')

    // IMask should ignore letters and keep a valid mask progression
    expect(input).toHaveValue('08-03-2024')
    const lastCall =
      handleChange.mock.calls[handleChange.mock.calls.length - 1][0]
    expect(lastCall.target.value).toBe('08-03-2024')
  })

  it('shows “-mm-yyyy” after two digits', async () => {
    const user = userEvent.setup()
    render(
      <DateInput
        id='dob'
        label='Geburtstag'
      />
    )

    const input = screen.getByRole('textbox', { name: 'Geburtstag' })
    await user.type(input, '01')

    expect(screen.getByText('-mm-yyyy')).toBeInTheDocument()
  })

  it('shows “-yyyy” after day and month', async () => {
    const user = userEvent.setup()
    render(
      <DateInput
        id='dob'
        label='Geburtstag'
      />
    )

    const input = screen.getByRole('textbox', { name: 'Geburtstag' })
    await user.type(input, '01-02')

    expect(screen.getByText('-yyyy')).toBeInTheDocument()
  })

  it('overlay disappears after full date', async () => {
    const user = userEvent.setup()
    render(
      <DateInput
        id='dob'
        label='Geburtstag'
      />
    )

    const input = screen.getByRole('textbox', { name: 'Geburtstag' })
    await user.type(input, '01-02-2024')

    expect(screen.queryByText(/-mm-yyyy|-yyyy/)).not.toBeInTheDocument()
  })

  it('controlled value updates overlay', () => {
    const { rerender } = render(
      <DateInput
        id='dob'
        label='Geburtstag'
        value='01-02'
      />
    )
    expect(screen.getByText('-yyyy')).toBeInTheDocument()
    rerender(
      <DateInput
        id='dob'
        label='Geburtstag'
        value='01-02-2024'
      />
    )
    expect(screen.queryByText('-yyyy')).not.toBeInTheDocument()
  })
})
