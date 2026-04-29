import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfigurableOptions } from '@/components/ui/configurable-options/configurable-options'

const mockRouterReplace = jest.fn()
const mockUpdateUrl = jest.fn()

jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: () => ({ replace: mockRouterReplace }),
  usePathname: () => '/p/test-product',
  useSearchParams: () => new URLSearchParams(),
}))

type UseVariantUrlReturn = {
  updateUrl: typeof mockUpdateUrl
  variantId: string | null
}

const mockUseVariantUrl: jest.Mock<UseVariantUrlReturn, []> = jest
  .fn()
  .mockReturnValue({
    updateUrl: mockUpdateUrl,
    variantId: null,
  })

jest.mock('../use-variant-url', () => ({
  useVariantUrl: () => mockUseVariantUrl(),
}))

describe('ConfigurableOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseVariantUrl.mockReturnValue({
      updateUrl: mockUpdateUrl,
      variantId: null,
    })
  })

  it('renders and handles selection changes', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()

    render(
      <ConfigurableOptions
        options={[
          {
            key: 'color',
            label: 'Color',
            type: 'color',
            options: [
              { label: 'Black', swatch: '#000000' },
              { label: 'White', swatch: '#FFFFFF' },
            ],
          },
          {
            key: 'size',
            label: 'Size',
            type: 'string',
            options: [{ label: 'S' }, { label: 'M' }],
          },
        ]}
        onChangeOption={onChange}
      />
    )

    expect(screen.getByText('Color')).toBeInTheDocument()
    expect(screen.getByText('Size')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'M' }))
    expect(onChange).toHaveBeenCalledWith('size', 'M')
  })

  it('calls updateUrl with variant ID when selecting options that match an existing variant', async () => {
    const user = userEvent.setup()
    const variantId = 'variant-123'

    render(
      <ConfigurableOptions
        options={[
          {
            key: 'color',
            label: 'Color',
            type: 'color',
            options: [
              { label: 'Black', swatch: '#000000' },
              { label: 'White', swatch: '#FFFFFF' },
            ],
          },
          {
            key: 'size',
            label: 'Size',
            type: 'string',
            options: [{ label: 'S' }, { label: 'M' }],
          },
        ]}
        variants={[
          {
            id: variantId,
            attributes: {
              color: 'Black',
              size: 'M',
            },
          },
          {
            id: 'variant-456',
            attributes: {
              color: 'White',
              size: 'S',
            },
          },
        ]}
      />
    )

    // Select first option (color: Black)
    await user.click(screen.getByTitle('Black'))

    // updateUrl should be called without variant ID when not all options are selected
    expect(mockUpdateUrl).toHaveBeenCalledWith()

    jest.clearAllMocks()

    // Select second option (size: M) - now all options match variant-123
    await user.click(screen.getByRole('button', { name: 'M' }))

    // updateUrl should be called with the matching variant ID
    expect(mockUpdateUrl).toHaveBeenCalledWith(variantId)
  })

  it('preselects options based on variant ID from URL', () => {
    const variantId = 'variant-123'

    // Mock useVariantUrl to return a variantId from URL
    mockUseVariantUrl.mockReturnValueOnce({
      updateUrl: mockUpdateUrl,
      variantId,
    })

    render(
      <ConfigurableOptions
        options={[
          {
            key: 'color',
            label: 'Color',
            type: 'color',
            options: [
              { label: 'Black', swatch: '#000000' },
              { label: 'White', swatch: '#FFFFFF' },
            ],
          },
          {
            key: 'size',
            label: 'Size',
            type: 'string',
            options: [{ label: 'S' }, { label: 'M' }],
          },
        ]}
        variants={[
          {
            id: variantId,
            attributes: {
              color: 'Black',
              size: 'M',
            },
          },
          {
            id: 'variant-456',
            attributes: {
              color: 'White',
              size: 'S',
            },
          },
        ]}
      />
    )

    // Check that the selected values are displayed in the labels
    // Text is split across spans, so we find the label and check the parent's textContent
    const colorLabel = screen.getByText('Color')
    expect(colorLabel.closest('div')?.textContent).toBe('Color: Black')

    const sizeLabel = screen.getByText('Size')
    expect(sizeLabel.closest('div')?.textContent).toBe('Size: M')

    // Check that the color button is selected (aria-selected="true")
    const blackButton = screen.getByTitle('Black')
    expect(blackButton).toHaveAttribute('aria-selected', 'true')

    // Check that the size button is selected (aria-selected="true")
    const sizeMButton = screen.getByRole('button', { name: 'M' })
    expect(sizeMButton).toHaveAttribute('aria-selected', 'true')
  })
})
