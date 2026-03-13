import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ValueSelector } from '@/components/ui/configurable-options/selectors/value-selector'

describe('ValueSelector', () => {
  it('shows more sizes when clicking show more', async () => {
    const user = userEvent.setup()
    render(
      <ValueSelector
        options={[
          { label: 'S' },
          { label: 'M' },
          { label: 'L' },
          { label: 'XL' },
        ]}
        maxVisible={2}
      />
    )
    // Initially only maxVisible option buttons should be present (exclude "show more" button)
    expect(
      screen.getAllByRole('button', { name: /^(S|M|L|XL)$/i }).length
    ).toBe(2)

    const btn = screen.getByTestId('show-more-sizes')
    await user.click(btn)
    // After expanding, all option buttons should be visible
    expect(
      screen.getAllByRole('button', { name: /^(S|M|L|XL)$/i }).length
    ).toBe(4)
    expect(screen.queryByTestId('show-more-sizes')).not.toBeInTheDocument()
  })
})
