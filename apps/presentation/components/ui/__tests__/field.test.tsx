import { render, screen } from '@testing-library/react'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldSet,
  FieldLegend,
  useFieldContext,
} from '../field'
import { TextInput } from '../inputs/text-input'
import { Checkbox } from '../checkbox'

describe('Field', () => {
  describe('Basic rendering and props', () => {
    it('renders with role group', () => {
      render(
        <Field>
          <TextInput
            id='test-input'
            label='Test'
          />
        </Field>
      )

      const field = screen.getByRole('group')
      expect(field).toBeInTheDocument()
      expect(field).toHaveAttribute('data-slot', 'field')
    })

    it('renders with vertical orientation by default', () => {
      render(
        <Field>
          <TextInput
            id='test-input'
            label='Test'
          />
        </Field>
      )

      const field = screen.getByRole('group')
      expect(field).toHaveAttribute('data-orientation', 'vertical')
    })

    it('renders with horizontal orientation when specified', () => {
      render(
        <Field orientation='horizontal'>
          <TextInput
            id='test-input'
            label='Test'
          />
        </Field>
      )

      const field = screen.getByRole('group')
      expect(field).toHaveAttribute('data-orientation', 'horizontal')
    })

    it('renders with data-invalid attribute', () => {
      render(
        <Field data-invalid={true}>
          <TextInput
            id='test-input'
            label='Test'
          />
        </Field>
      )

      const field = screen.getByRole('group')
      expect(field).toHaveAttribute('data-invalid', 'true')
    })

    it('renders with custom className', () => {
      render(
        <Field className='custom-class'>
          <TextInput
            id='test-input'
            label='Test'
          />
        </Field>
      )

      const field = screen.getByRole('group')
      expect(field).toHaveClass('custom-class')
    })
  })

  describe('Field Context', () => {
    it('provides context to children when invalid', () => {
      const TestComponent = () => {
        const context = useFieldContext()
        return (
          <div data-testid='context-consumer'>
            {context?.isInvalid ? 'invalid' : 'valid'}
          </div>
        )
      }

      render(
        <Field data-invalid={true}>
          <TestComponent />
        </Field>
      )

      expect(screen.getByTestId('context-consumer')).toHaveTextContent(
        'invalid'
      )
    })

    it('provides context to children when valid', () => {
      const TestComponent = () => {
        const context = useFieldContext()
        return (
          <div data-testid='context-consumer'>
            {context?.isInvalid ? 'invalid' : 'valid'}
          </div>
        )
      }

      render(
        <Field data-invalid={false}>
          <TestComponent />
        </Field>
      )

      expect(screen.getByTestId('context-consumer')).toHaveTextContent('valid')
    })

    it('provides errorId and descriptionId in context', () => {
      const TestComponent = () => {
        const context = useFieldContext()
        return (
          <div data-testid='context-consumer'>
            errorId: {context?.errorId}, descriptionId: {context?.descriptionId}
          </div>
        )
      }

      render(
        <Field>
          <TestComponent />
        </Field>
      )

      const consumer = screen.getByTestId('context-consumer')
      expect(consumer.textContent).toMatch(/errorId: field-error-/)
      expect(consumer.textContent).toMatch(/descriptionId: field-description-/)
    })
  })

  describe('useFieldContext hook', () => {
    it('returns null when used outside Field', () => {
      const TestComponent = () => {
        const context = useFieldContext()
        return (
          <div data-testid='context-result'>
            {context === null ? 'null' : 'not-null'}
          </div>
        )
      }

      render(<TestComponent />)

      expect(screen.getByTestId('context-result')).toHaveTextContent('null')
    })

    it('returns context when used inside Field', () => {
      const TestComponent = () => {
        const context = useFieldContext()
        return (
          <div data-testid='context-result'>
            {context !== null ? 'has-context' : 'no-context'}
          </div>
        )
      }

      render(
        <Field>
          <TestComponent />
        </Field>
      )

      expect(screen.getByTestId('context-result')).toHaveTextContent(
        'has-context'
      )
    })
  })
})

describe('FieldDescription', () => {
  it('renders description text', () => {
    render(
      <Field>
        <FieldDescription>This is a helpful description</FieldDescription>
      </Field>
    )

    expect(
      screen.getByText('This is a helpful description')
    ).toBeInTheDocument()
  })

  it('has correct data-slot attribute', () => {
    render(
      <Field>
        <FieldDescription>Description</FieldDescription>
      </Field>
    )

    const description = screen.getByText('Description')
    expect(description).toHaveAttribute('data-slot', 'field-description')
  })

  it('receives ID from Field context', () => {
    const TestComponent = () => {
      const context = useFieldContext()
      return (
        <div>
          <FieldDescription>Description</FieldDescription>
          <div data-testid='context-id'>{context?.descriptionId}</div>
        </div>
      )
    }

    render(
      <Field>
        <TestComponent />
      </Field>
    )

    const description = screen.getByText('Description')
    const contextId = screen.getByTestId('context-id').textContent

    expect(description).toHaveAttribute('id', contextId!)
  })
})

describe('FieldError', () => {
  it('renders error message', () => {
    render(
      <Field data-invalid={true}>
        <FieldError error={{ message: 'This field is required' }} />
      </Field>
    )

    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('renders with role alert', () => {
    render(
      <Field data-invalid={true}>
        <FieldError error={{ message: 'Error message' }} />
      </Field>
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('receives ID from Field context', () => {
    const TestComponent = () => {
      const context = useFieldContext()
      return (
        <div>
          <FieldError error={{ message: 'Error' }} />
          <div data-testid='context-error-id'>{context?.errorId}</div>
        </div>
      )
    }

    render(
      <Field data-invalid={true}>
        <TestComponent />
      </Field>
    )

    const errorElement = screen.getByRole('alert')
    const contextId = screen.getByTestId('context-error-id').textContent

    expect(errorElement).toHaveAttribute('id', contextId!)
  })
})

describe('FieldSet', () => {
  it('renders as fieldset element', () => {
    const { container } = render(
      <FieldSet>
        <legend>Group</legend>
      </FieldSet>
    )

    const fieldset = container.querySelector('fieldset')
    expect(fieldset).toBeInTheDocument()
    expect(fieldset).toHaveAttribute('data-slot', 'field-set')
  })
})

describe('FieldLegend', () => {
  it('renders legend text', () => {
    const { container } = render(
      <FieldSet>
        <FieldLegend>Payment Method</FieldLegend>
      </FieldSet>
    )

    expect(screen.getByText('Payment Method')).toBeInTheDocument()
    const legend = container.querySelector('legend')
    expect(legend).toBeInTheDocument()
  })

  it('has correct data-slot attribute', () => {
    const { container } = render(
      <FieldSet>
        <FieldLegend>Legend</FieldLegend>
      </FieldSet>
    )

    const legend = container.querySelector('legend')
    expect(legend).toHaveAttribute('data-slot', 'field-legend')
  })

  it('renders with legend variant by default', () => {
    const { container } = render(
      <FieldSet>
        <FieldLegend>Legend</FieldLegend>
      </FieldSet>
    )

    const legend = container.querySelector('legend')
    expect(legend).toHaveAttribute('data-variant', 'legend')
  })

  it('renders with label variant when specified', () => {
    const { container } = render(
      <FieldSet>
        <FieldLegend variant='label'>Legend</FieldLegend>
      </FieldSet>
    )

    const legend = container.querySelector('legend')
    expect(legend).toHaveAttribute('data-variant', 'label')
  })

  it('renders with required indicator when required prop is true', () => {
    const { container } = render(
      <FieldSet>
        <FieldLegend required>Required Field</FieldLegend>
      </FieldSet>
    )

    const legend = container.querySelector('legend')
    // Check if the after pseudo-element class is applied
    expect(legend?.className).toMatch(/after:content-\["\*"\]/)
  })

  it('does not render required indicator when required prop is false', () => {
    const { container } = render(
      <FieldSet>
        <FieldLegend required={false}>Optional Field</FieldLegend>
      </FieldSet>
    )

    const legend = container.querySelector('legend')
    // The className should not include the after content
    expect(legend?.className).not.toMatch(/after:content-\["\*"\]/)
  })

  it('renders with custom className', () => {
    const { container } = render(
      <FieldSet>
        <FieldLegend className='custom-legend'>Legend</FieldLegend>
      </FieldSet>
    )

    const legend = container.querySelector('legend')
    expect(legend).toHaveClass('custom-legend')
  })
})

describe('Field Integration', () => {
  it('works with TextInput and shows error', () => {
    render(
      <Field data-invalid={true}>
        <TextInput
          id='test-input'
          label='Name'
        />
        <FieldError error={{ message: 'Name is required' }} />
      </Field>
    )

    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByText('Name is required')).toBeInTheDocument()
  })

  it('works with Checkbox', () => {
    render(
      <Field>
        <Checkbox id='terms' />
      </Field>
    )

    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('TextInput has aria-describedby pointing to error when Field is invalid', () => {
    render(
      <Field data-invalid={true}>
        <TextInput
          id='name-input'
          label='Name'
        />
        <FieldError error={{ message: 'Name is required' }} />
      </Field>
    )

    const input = screen.getByRole('textbox')
    const error = screen.getByRole('alert')

    const describedBy = input.getAttribute('aria-describedby')
    expect(describedBy).toContain(error.id)
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('TextInput has aria-describedby with both error and description IDs when invalid', () => {
    render(
      <Field data-invalid={true}>
        <TextInput
          id='password-input'
          label='Password'
        />
        <FieldDescription>Must be at least 8 characters</FieldDescription>
        <FieldError error={{ message: 'Password is too short' }} />
      </Field>
    )

    const input = screen.getByRole('textbox')
    const description = screen.getByText('Must be at least 8 characters')
    const error = screen.getByRole('alert')

    const describedBy = input.getAttribute('aria-describedby')
    expect(describedBy).toContain(error.id)
    expect(describedBy).toContain(description.id)
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('TextInput shows error state styling when Field is invalid', () => {
    render(
      <Field data-invalid={true}>
        <TextInput
          id='styled-input'
          label='Styled Input'
        />
        <FieldError error={{ message: 'Error' }} />
      </Field>
    )

    const input = screen.getByRole('textbox')

    // Check if input has error border styling (from inputVariants error state)
    expect(input).toHaveClass('border-red-600')
  })
})
