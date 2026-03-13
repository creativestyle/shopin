import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from '../checkbox'

describe('Checkbox', () => {
  it('renders without crashing', () => {
    render(<Checkbox />)

    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('renders with default props', () => {
    render(<Checkbox />)

    const checkboxElement = screen.getByRole('checkbox')
    expect(checkboxElement).toBeInTheDocument()
    expect(checkboxElement).not.toBeChecked()
  })

  it('renders as checked when checked prop is true', () => {
    render(<Checkbox checked />)

    const checkboxElement = screen.getByRole('checkbox')
    expect(checkboxElement).toBeChecked()
  })

  it('renders as unchecked when checked prop is false', () => {
    render(<Checkbox checked={false} />)

    const checkboxElement = screen.getByRole('checkbox')
    expect(checkboxElement).not.toBeChecked()
  })

  it('renders as disabled when disabled prop is true', () => {
    render(<Checkbox disabled />)

    const checkboxElement = screen.getByRole('checkbox')
    expect(checkboxElement).toBeDisabled()
  })

  it('renders with aria-label', () => {
    render(<Checkbox aria-label='Accept terms' />)

    const checkboxElement = screen.getByRole('checkbox', {
      name: 'Accept terms',
    })
    expect(checkboxElement).toBeInTheDocument()
  })

  it('renders with aria-labelledby', () => {
    render(
      <div>
        <label
          htmlFor='checkboxElement'
          id='checkboxElement-label'
        >
          Accept terms
        </label>
        <Checkbox
          id='checkboxElement'
          aria-labelledby='checkboxElement-label'
        />
      </div>
    )

    const checkboxElement = screen.getByRole('checkbox', {
      name: 'Accept terms',
    })
    expect(checkboxElement).toBeInTheDocument()
  })

  it('renders with aria-describedby', () => {
    render(
      <div>
        <Checkbox aria-describedby='checkboxElement-desc' />
        <div id='checkboxElement-desc'>This controls acceptance</div>
      </div>
    )

    const checkboxElement = screen.getByRole('checkbox')
    expect(checkboxElement).toBeInTheDocument()
  })

  it('handles change events', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()

    render(<Checkbox onCheckedChange={handleChange} />)

    const checkboxElement = screen.getByRole('checkbox')
    await user.click(checkboxElement)

    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('toggles state when clicked', async () => {
    const user = userEvent.setup()

    render(<Checkbox />)

    const checkboxElement = screen.getByRole('checkbox')
    expect(checkboxElement).not.toBeChecked()

    await user.click(checkboxElement)
    expect(checkboxElement).toBeChecked()

    await user.click(checkboxElement)
    expect(checkboxElement).not.toBeChecked()
  })

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()

    render(
      <Checkbox
        disabled
        onCheckedChange={handleChange}
      />
    )

    const checkboxElement = screen.getByRole('checkbox')
    expect(checkboxElement).toBeDisabled()
    expect(checkboxElement).not.toBeChecked()

    await user.click(checkboxElement)

    expect(handleChange).not.toHaveBeenCalled()
    expect(checkboxElement).not.toBeChecked()
  })

  it('renders with required prop', () => {
    render(<Checkbox required />)

    const checkboxElement = screen.getByRole('checkbox')
    expect(checkboxElement).toBeInTheDocument()
  })

  it('renders with multiple props combined', () => {
    render(
      <Checkbox
        checked
        disabled
        className='custom-class'
        aria-label='Custom checkbox'
        data-testid='multi-prop-checkbox'
      />
    )

    const checkboxElement = screen.getByTestId('multi-prop-checkbox')
    expect(checkboxElement).toBeInTheDocument()
    expect(checkboxElement).toBeChecked()
    expect(checkboxElement).toBeDisabled()
    expect(checkboxElement).toHaveAttribute('aria-label', 'Custom checkbox')
  })

  it('renders with controlled state', () => {
    const { rerender } = render(<Checkbox checked={false} />)

    let checkboxElement = screen.getByRole('checkbox')
    expect(checkboxElement).not.toBeChecked()

    rerender(<Checkbox checked={true} />)
    checkboxElement = screen.getByRole('checkbox')
    expect(checkboxElement).toBeChecked()
  })

  it('renders with defaultChecked prop', () => {
    render(<Checkbox defaultChecked />)

    const checkboxElement = screen.getByRole('checkbox')
    expect(checkboxElement).toBeChecked()
  })
})
