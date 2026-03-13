import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RadioGroup, RadioGroupItem } from '../radio-button'

describe('RadioButton', () => {
  it('renders group and items', () => {
    render(
      <RadioGroup>
        <RadioGroupItem
          id='r1'
          value='a'
        />
        <RadioGroupItem
          id='r2'
          value='b'
        />
      </RadioGroup>
    )

    const radios = screen.getAllByRole('radio')
    expect(radios.length).toBe(2)
  })

  it('none selected by default', () => {
    render(
      <RadioGroup>
        <RadioGroupItem
          id='r1'
          value='a'
        />
        <RadioGroupItem
          id='r2'
          value='b'
        />
      </RadioGroup>
    )

    const [r1, r2] = screen.getAllByRole('radio')
    expect(r1).not.toBeChecked()
    expect(r2).not.toBeChecked()
  })

  it('selects item via defaultValue', () => {
    render(
      <RadioGroup defaultValue='a'>
        <RadioGroupItem
          id='r1'
          value='a'
        />
        <RadioGroupItem
          id='r2'
          value='b'
        />
      </RadioGroup>
    )

    const [first, second] = screen.getAllByRole('radio')
    expect(first).toBeChecked()
    expect(second).not.toBeChecked()
  })

  it('associates aria-label', () => {
    render(
      <RadioGroup>
        <RadioGroupItem
          id='r1'
          value='a'
          aria-label='Option A'
        />
      </RadioGroup>
    )

    expect(screen.getByRole('radio', { name: 'Option A' })).toBeInTheDocument()
  })

  it('associates aria-labelledby', async () => {
    render(
      <div>
        <RadioGroup>
          <div>
            <RadioGroupItem
              id='r1'
              value='a'
              aria-labelledby='lbl-r1'
            />
            <label
              htmlFor='r1'
              id='lbl-r1'
            >
              Option A
            </label>
          </div>
        </RadioGroup>
      </div>
    )

    expect(screen.getByRole('radio', { name: 'Option A' })).toBeInTheDocument()
    const user = userEvent.setup()
    await user.click(screen.getByLabelText('Option A'))
    expect(screen.getByRole('radio', { name: 'Option A' })).toBeChecked()
  })

  it('calls onValueChange when selection changes', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()

    render(
      <RadioGroup onValueChange={handleChange}>
        <RadioGroupItem
          id='r1'
          value='a'
        />
        <RadioGroupItem
          id='r2'
          value='b'
        />
      </RadioGroup>
    )

    const [, r2] = screen.getAllByRole('radio')
    await user.click(r2)
    expect(handleChange).toHaveBeenCalledWith('b')
  })

  it('toggles selection between items on click', async () => {
    const user = userEvent.setup()

    render(
      <RadioGroup defaultValue='a'>
        <RadioGroupItem
          id='r1'
          value='a'
        />
        <RadioGroupItem
          id='r2'
          value='b'
        />
      </RadioGroup>
    )

    const [r1, r2] = screen.getAllByRole('radio')
    expect(r1).toBeChecked()
    expect(r2).not.toBeChecked()

    await user.click(r2)
    expect(r1).not.toBeChecked()
    expect(r2).toBeChecked()
  })

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup()

    const onChange = jest.fn()
    render(
      <RadioGroup onValueChange={onChange}>
        <RadioGroupItem
          id='rd-dis-1'
          value='a'
          disabled
          aria-label='Disabled A'
        />
        <RadioGroupItem
          id='rd-en-2'
          value='b'
          aria-label='Enabled B'
        />
      </RadioGroup>
    )

    const disabledRadio = screen.getByRole('radio', {
      name: 'Disabled A',
    }) as HTMLButtonElement
    expect(disabledRadio).toBeDisabled()
    await user.click(disabledRadio)
    expect(onChange).not.toHaveBeenCalled()
  })
})
