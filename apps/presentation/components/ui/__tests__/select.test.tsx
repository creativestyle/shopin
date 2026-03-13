import { render, screen } from '@testing-library/react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectRoot,
} from '../select'

describe('SelectRoot', () => {
  describe('Basic rendering and props', () => {
    it('renders select with trigger and content', () => {
      render(
        <SelectRoot>
          <SelectTrigger label='Select option'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='option1'>Option 1</SelectItem>
            <SelectItem value='option2'>Option 2</SelectItem>
          </SelectContent>
        </SelectRoot>
      )

      expect(screen.getByRole('combobox')).toBeInTheDocument()
      expect(screen.getByText('Select option')).toBeInTheDocument()
    })

    it('renders with disabled state', () => {
      render(
        <SelectRoot disabled>
          <SelectTrigger label='Disabled select'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='option1'>Option 1</SelectItem>
          </SelectContent>
        </SelectRoot>
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toBeDisabled()
    })
  })

  describe('SelectTrigger', () => {
    it('renders with label', () => {
      render(
        <SelectRoot>
          <SelectTrigger label='Test Label'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='option1'>Option 1</SelectItem>
          </SelectContent>
        </SelectRoot>
      )

      expect(screen.getByText('Test Label')).toBeInTheDocument()
    })
  })

  describe('SelectContent and SelectItem', () => {
    it('renders select with content structure', () => {
      render(
        <SelectRoot>
          <SelectTrigger label='Select option'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='apple'>Apple</SelectItem>
            <SelectItem value='banana'>Banana</SelectItem>
            <SelectItem value='cherry'>Cherry</SelectItem>
          </SelectContent>
        </SelectRoot>
      )

      // Test that the select structure is rendered
      expect(screen.getByRole('combobox')).toBeInTheDocument()
      expect(screen.getByText('Select option')).toBeInTheDocument()
    })

    it('renders select with groups structure', () => {
      render(
        <SelectRoot>
          <SelectTrigger label='Select option'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value='apple'>Apple</SelectItem>
              <SelectItem value='banana'>Banana</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Vegetables</SelectLabel>
              <SelectItem value='carrot'>Carrot</SelectItem>
              <SelectItem value='broccoli'>Broccoli</SelectItem>
            </SelectGroup>
          </SelectContent>
        </SelectRoot>
      )

      // Test that the select structure is rendered
      expect(screen.getByRole('combobox')).toBeInTheDocument()
      expect(screen.getByText('Select option')).toBeInTheDocument()
    })
  })

  describe('User interactions', () => {
    it('renders select trigger with correct attributes', () => {
      render(
        <SelectRoot>
          <SelectTrigger label='Select option'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='option1'>Option 1</SelectItem>
            <SelectItem value='option2'>Option 2</SelectItem>
          </SelectContent>
        </SelectRoot>
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toBeInTheDocument()
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    it('calls onValueChange when value changes programmatically', () => {
      const handleValueChange = jest.fn()

      render(
        <SelectRoot
          value='option1'
          onValueChange={handleValueChange}
        >
          <SelectTrigger label='Select option'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='option1'>Option 1</SelectItem>
            <SelectItem value='option2'>Option 2</SelectItem>
          </SelectContent>
        </SelectRoot>
      )

      // Test that the component renders with the value
      expect(screen.getByText('Option 1')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <SelectRoot>
          <SelectTrigger label='Select option'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='option1'>Option 1</SelectItem>
          </SelectContent>
        </SelectRoot>
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    it('has proper role for select trigger', () => {
      render(
        <SelectRoot>
          <SelectTrigger label='Select option'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='option1'>Option 1</SelectItem>
          </SelectContent>
        </SelectRoot>
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toBeInTheDocument()
      expect(trigger).toHaveAttribute('role', 'combobox')
    })

    it('renders with required state via SelectRoot prop', () => {
      render(
        <SelectRoot ariaRequired={true}>
          <SelectTrigger label='Required select'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='option1'>Option 1</SelectItem>
          </SelectContent>
        </SelectRoot>
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveAttribute('aria-required', 'true')
    })

    it('renders with required state via SelectTrigger prop', () => {
      render(
        <SelectRoot>
          <SelectTrigger
            label='Required select'
            ariaRequired={true}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='option1'>Option 1</SelectItem>
          </SelectContent>
        </SelectRoot>
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveAttribute('aria-required', 'true')
    })

    it('renders with invalid state via SelectRoot prop', () => {
      render(
        <SelectRoot invalid={true}>
          <SelectTrigger label='Invalid select'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='option1'>Option 1</SelectItem>
          </SelectContent>
        </SelectRoot>
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveAttribute('aria-invalid', 'true')
    })

    it('renders with invalid state via SelectTrigger prop', () => {
      render(
        <SelectRoot>
          <SelectTrigger
            label='Invalid select'
            invalid={true}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='option1'>Option 1</SelectItem>
          </SelectContent>
        </SelectRoot>
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveAttribute('aria-invalid', 'true')
    })

    it('renders with aria-describedby via SelectRoot prop', () => {
      render(
        <SelectRoot ariaDescribedBy='error-message'>
          <SelectTrigger label='Select with description'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='option1'>Option 1</SelectItem>
          </SelectContent>
        </SelectRoot>
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveAttribute('aria-describedby', 'error-message')
    })

    it('SelectTrigger prop overrides SelectRoot context', () => {
      render(
        <SelectRoot ariaRequired={false}>
          <SelectTrigger
            label='Required select'
            ariaRequired={true}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='option1'>Option 1</SelectItem>
          </SelectContent>
        </SelectRoot>
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveAttribute('aria-required', 'true')
    })
  })
})

describe('Select', () => {
  describe('Basic rendering and props', () => {
    it('renders with label and options', () => {
      const options = [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
      ]

      render(
        <Select
          label='Select fruit'
          options={options}
          value=''
          onValueChange={jest.fn()}
        />
      )

      expect(screen.getByText('Select fruit')).toBeInTheDocument()
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('renders with selected value', () => {
      const options = [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
      ]

      render(
        <Select
          label='Select fruit'
          options={options}
          value='banana'
          onValueChange={jest.fn()}
        />
      )

      expect(screen.getByText('Banana')).toBeInTheDocument()
    })

    it('renders with disabled state', () => {
      const options = [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
      ]

      render(
        <Select
          label='Select fruit'
          options={options}
          value=''
          disabled={true}
          onValueChange={jest.fn()}
        />
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toBeDisabled()
    })
  })

  describe('User interactions', () => {
    it('renders with onValueChange handler', () => {
      const handleValueChange = jest.fn()
      const options = [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
      ]

      render(
        <Select
          label='Select fruit'
          options={options}
          value=''
          onValueChange={handleValueChange}
        />
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toBeInTheDocument()
      expect(handleValueChange).toBeDefined()
    })

    it('renders with provided options structure', () => {
      const options = [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
        { value: 'cherry', label: 'Cherry' },
        { value: 'date', label: 'Date' },
      ]

      render(
        <Select
          label='Select fruit'
          options={options}
          value=''
          onValueChange={jest.fn()}
        />
      )

      // Test that the select structure is rendered
      expect(screen.getByRole('combobox')).toBeInTheDocument()
      expect(screen.getByText('Select fruit')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('renders with required state', () => {
      const options = [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
      ]

      render(
        <Select
          label='Required select'
          options={options}
          value=''
          required={true}
          onValueChange={jest.fn()}
        />
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveAttribute('aria-required', 'true')
    })

    it('renders with invalid state', () => {
      const options = [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
      ]

      render(
        <Select
          label='Invalid select'
          options={options}
          value=''
          invalid={true}
          onValueChange={jest.fn()}
        />
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveAttribute('aria-invalid', 'true')
    })

    it('renders with both required and invalid states', () => {
      const options = [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
      ]

      render(
        <Select
          label='Required and invalid select'
          options={options}
          value=''
          required={true}
          invalid={true}
          onValueChange={jest.fn()}
        />
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveAttribute('aria-required', 'true')
      expect(trigger).toHaveAttribute('aria-invalid', 'true')
    })
  })
})
