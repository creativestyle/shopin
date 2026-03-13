import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchBar } from '@/components/ui/search-bar'

describe('SearchBar', () => {
  it('triggers onSearch on Enter', async () => {
    const user = userEvent.setup()
    const onSearch = jest.fn()
    render(
      <SearchBar
        placeholder='Search…'
        onSearch={onSearch}
      />
    )
    const input = screen.getByRole('textbox', { name: /search/i })
    await user.type(input, 'jeans{enter}')
    expect(onSearch).toHaveBeenCalledWith('jeans')
  })
})
