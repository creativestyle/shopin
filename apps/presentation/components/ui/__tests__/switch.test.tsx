import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Switch } from '../switch'

// Mock ResizeObserver for Radix UI
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

describe('Switch', () => {
  it('renders without crashing', () => {
    render(<Switch />)

    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('renders with default props', () => {
    render(<Switch />)

    const switchElement = screen.getByRole('switch')
    expect(switchElement).toBeInTheDocument()
    expect(switchElement).not.toBeChecked()
  })

  it('renders as checked when checked prop is true', () => {
    render(<Switch checked />)

    const switchElement = screen.getByRole('switch')
    expect(switchElement).toBeChecked()
  })

  it('renders as unchecked when checked prop is false', () => {
    render(<Switch checked={false} />)

    const switchElement = screen.getByRole('switch')
    expect(switchElement).not.toBeChecked()
  })

  it('renders as disabled when disabled prop is true', () => {
    render(<Switch disabled />)

    const switchElement = screen.getByRole('switch')
    expect(switchElement).toBeDisabled()
  })

  it('renders with aria-label', () => {
    render(<Switch aria-label='Toggle setting' />)

    const switchElement = screen.getByRole('switch', { name: 'Toggle setting' })
    expect(switchElement).toBeInTheDocument()
  })

  it('renders with aria-labelledby', () => {
    render(
      <div>
        <label
          htmlFor='switch'
          id='switch-label'
        >
          Enable notifications
        </label>
        <Switch
          id='switch'
          aria-labelledby='switch-label'
        />
      </div>
    )

    const switchElement = screen.getByRole('switch', {
      name: 'Enable notifications',
    })
    expect(switchElement).toBeInTheDocument()
  })

  it('renders with aria-describedby', () => {
    render(
      <div>
        <Switch aria-describedby='switch-description' />
        <div id='switch-description'>
          This controls the notification setting
        </div>
      </div>
    )

    const switchElement = screen.getByRole('switch')
    expect(switchElement).toBeInTheDocument()
  })

  it('handles change events', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()

    render(<Switch onCheckedChange={handleChange} />)

    const switchElement = screen.getByRole('switch')
    await user.click(switchElement)

    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('toggles state when clicked', async () => {
    const user = userEvent.setup()

    render(<Switch />)

    const switchElement = screen.getByRole('switch')
    expect(switchElement).not.toBeChecked()

    await user.click(switchElement)
    expect(switchElement).toBeChecked()

    await user.click(switchElement)
    expect(switchElement).not.toBeChecked()
  })

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()

    render(
      <Switch
        disabled
        onCheckedChange={handleChange}
      />
    )

    const switchElement = screen.getByRole('switch')
    expect(switchElement).toBeDisabled()
    expect(switchElement).not.toBeChecked()

    await user.click(switchElement)

    expect(handleChange).not.toHaveBeenCalled()
    expect(switchElement).not.toBeChecked()
  })

  it('renders with required prop', () => {
    render(<Switch required />)

    const switchElement = screen.getByRole('switch')
    expect(switchElement).toBeInTheDocument()
  })

  it('renders with multiple props combined', () => {
    render(
      <Switch
        checked
        disabled
        scheme='accent'
        className='custom-class'
        aria-label='Custom switch'
        data-testid='multi-prop-switch'
      />
    )

    const switchElement = screen.getByTestId('multi-prop-switch')
    expect(switchElement).toBeInTheDocument()
    expect(switchElement).toBeChecked()
    expect(switchElement).toBeDisabled()
    expect(switchElement).toHaveAttribute('aria-label', 'Custom switch')
  })

  it('renders with controlled state', () => {
    const { rerender } = render(<Switch checked={false} />)

    let switchElement = screen.getByRole('switch')
    expect(switchElement).not.toBeChecked()

    rerender(<Switch checked={true} />)
    switchElement = screen.getByRole('switch')
    expect(switchElement).toBeChecked()
  })

  it('renders with defaultChecked prop', () => {
    render(<Switch defaultChecked />)

    const switchElement = screen.getByRole('switch')
    expect(switchElement).toBeChecked()
  })

  it('renders with id prop', () => {
    render(<Switch id='notification-switch' />)

    const switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveAttribute('id', 'notification-switch')
  })
})
