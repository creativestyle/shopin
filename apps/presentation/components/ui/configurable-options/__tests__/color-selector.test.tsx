import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ColorSelector } from '@/components/ui/configurable-options/selectors/color-selector'

describe('ColorSelector', () => {
  it('selects a color when clicked', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    render(
      <ColorSelector
        options={[
          { label: 'Red', swatch: '#f00' },
          { label: 'Blue', swatch: '#00f' },
        ]}
        onChange={onChange}
      />
    )
    await user.click(screen.getByRole('button', { name: 'Red' }))
    expect(onChange).toHaveBeenCalledWith('Red')
  })
})
