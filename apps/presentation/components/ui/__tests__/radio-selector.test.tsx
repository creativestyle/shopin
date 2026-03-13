import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RadioSelector, RadioSelectorOption } from '../radio-selector'

describe('RadioSelector', () => {
  it('renders options and allows selection via onValueChange', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()

    render(
      <RadioSelector
        defaultValue='a'
        onValueChange={handleChange}
      >
        <RadioSelectorOption
          id='opt-a'
          value='a'
          label='Label A'
        />
        <RadioSelectorOption
          id='opt-b'
          value='b'
          label='Label B'
        />
      </RadioSelector>
    )

    const [a, b] = screen.getAllByRole('radio')
    expect(a).toBeChecked()
    expect(b).not.toBeChecked()

    await user.click(screen.getByRole('radio', { name: 'Label B' }))
    expect(handleChange).toHaveBeenCalledWith('b')
    expect(b).toBeChecked()
  })

  it('associates accessible name from label (with labelInfo icon present)', () => {
    render(
      <RadioSelector>
        <RadioSelectorOption
          id='opt-info'
          value='info'
          label='Delivery'
          labelInfo='More information about delivery'
        />
      </RadioSelector>
    )

    expect(screen.getByRole('radio', { name: 'Delivery' })).toBeInTheDocument()

    const radio = screen.getByRole('radio', { name: 'Delivery' })
    expect(radio).toHaveAttribute('aria-labelledby', 'opt-info-label')
    const labelEl = document.getElementById('opt-info-label')
    expect(labelEl).toBeTruthy()
    expect(labelEl?.textContent).toContain('Delivery')
  })

  it('uses description as the accessible label when label is omitted', async () => {
    const user = userEvent.setup()

    render(
      <RadioSelector>
        <RadioSelectorOption
          id='addr-1'
          value='addr-1'
          description={
            <div>
              <p>Herr John Doe</p>
              <p>Bahnhofstrasse 12</p>
              <p>8001 Zürich</p>
            </div>
          }
        />
      </RadioSelector>
    )

    // The description content should label the control
    const radio = screen.getByLabelText(/Herr John Doe/i)
    expect(radio).toBeInTheDocument()

    expect(radio).toHaveAttribute('aria-labelledby', 'addr-1-label')
    const descEl = document.getElementById('addr-1-label')
    expect(descEl).toBeTruthy()
    expect(descEl?.textContent).toMatch(/Herr John Doe/)

    await user.click(radio)
    expect(radio).toBeChecked()
  })

  it('does not toggle disabled option', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()

    render(
      <RadioSelector onValueChange={handleChange}>
        <RadioSelectorOption
          id='dis-1'
          value='a'
          label='Disabled'
          disabled
        />
        <RadioSelectorOption
          id='en-2'
          value='b'
          label='Enabled'
        />
      </RadioSelector>
    )

    const disabledRadio = screen.getByRole('radio', {
      name: 'Disabled',
    }) as HTMLButtonElement
    expect(disabledRadio).toBeDisabled()
    await user.click(disabledRadio)
    expect(handleChange).not.toHaveBeenCalled()
  })
})
