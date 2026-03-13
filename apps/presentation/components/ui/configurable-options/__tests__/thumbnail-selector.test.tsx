import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThumbnailSelector } from '@/components/ui/configurable-options/selectors/thumbnail-selector'

describe('ThumbnailSelector', () => {
  it('selects a thumbnail on click', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    render(
      <ThumbnailSelector
        options={[
          { label: 'Variant 1', imageSrc: '/img.jpg' },
          { label: 'Variant 2', imageSrc: '/img.jpg' },
        ]}
        onChange={onChange}
      />
    )
    await user.click(screen.getByRole('button', { name: 'Variant 1' }))
    expect(onChange).toHaveBeenCalledWith('Variant 1')
  })
})
