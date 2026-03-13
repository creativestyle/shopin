import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuantitySwitcher } from '../quantity-switcher'

describe('QuantitySwitcher', () => {
  const user = userEvent.setup()

  describe('Button interactions', () => {
    it('calls onIncrease when plus button is clicked', async () => {
      const handleIncrease = jest.fn()
      render(
        <QuantitySwitcher
          value={1}
          onDecrease={jest.fn()}
          onIncrease={handleIncrease}
        />
      )

      const increaseButton = screen.getByRole('button', {
        name: /increase/i,
      })
      await user.click(increaseButton)

      expect(handleIncrease).toHaveBeenCalledTimes(1)
    })

    it('calls onDecrease when minus button is clicked', async () => {
      const handleDecrease = jest.fn()
      render(
        <QuantitySwitcher
          value={5}
          onDecrease={handleDecrease}
          onIncrease={jest.fn()}
        />
      )

      const decreaseButton = screen.getByRole('button', {
        name: /decrease/i,
      })
      await user.click(decreaseButton)

      expect(handleDecrease).toHaveBeenCalledTimes(1)
    })

    it('disables decrease button when value is at minimum', () => {
      render(
        <QuantitySwitcher
          value={1}
          min={1}
          onDecrease={jest.fn()}
          onIncrease={jest.fn()}
        />
      )

      const decreaseButton = screen.getByRole('button', {
        name: /decrease/i,
      })
      expect(decreaseButton).toBeDisabled()
    })

    it('disables increase button when value is at maximum', () => {
      render(
        <QuantitySwitcher
          value={10}
          min={1}
          max={10}
          onDecrease={jest.fn()}
          onIncrease={jest.fn()}
        />
      )

      const increaseButton = screen.getByRole('button', {
        name: /increase/i,
      })
      expect(increaseButton).toBeDisabled()
    })

    it('disables component when disabled prop is true', () => {
      render(
        <QuantitySwitcher
          value={5}
          disabled
          onDecrease={jest.fn()}
          onIncrease={jest.fn()}
        />
      )

      const decreaseButton = screen.getByRole('button', {
        name: /decrease/i,
      })
      const increaseButton = screen.getByRole('button', {
        name: /increase/i,
      })
      const input = screen.getByRole('spinbutton')

      expect(decreaseButton).toBeDisabled()
      expect(increaseButton).toBeDisabled()
      expect(input).toBeDisabled()
    })
  })

  describe('Input validation', () => {
    it('calls onChange with validated value on blur', async () => {
      const handleChange = jest.fn()
      render(
        <QuantitySwitcher
          value={1}
          onDecrease={jest.fn()}
          onIncrease={jest.fn()}
          onChange={handleChange}
        />
      )

      const input = screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '5')
      await user.tab() // Blur the input

      expect(handleChange).toHaveBeenCalledWith(5)
    })

    it('validates input value against min on blur', async () => {
      const handleChange = jest.fn()
      render(
        <QuantitySwitcher
          value={5}
          min={1}
          onDecrease={jest.fn()}
          onIncrease={jest.fn()}
          onChange={handleChange}
        />
      )

      const input = screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '0')
      await user.tab() // Blur the input

      expect(input).toHaveValue('1')
      expect(handleChange).toHaveBeenCalledWith(1)
    })

    it('validates input value against max on blur', async () => {
      const handleChange = jest.fn()
      render(
        <QuantitySwitcher
          value={5}
          min={1}
          max={10}
          onDecrease={jest.fn()}
          onIncrease={jest.fn()}
          onChange={handleChange}
        />
      )

      const input = screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '15')
      await user.tab() // Blur the input

      expect(input).toHaveValue('10')
      expect(handleChange).toHaveBeenCalledWith(10)
    })

    it('resets to min when input is invalid (NaN) on blur', async () => {
      const handleChange = jest.fn()
      render(
        <QuantitySwitcher
          value={5}
          min={1}
          onDecrease={jest.fn()}
          onIncrease={jest.fn()}
          onChange={handleChange}
        />
      )

      const input = screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, 'abc')
      await user.tab() // Blur the input

      expect(input).toHaveValue('1')
      expect(handleChange).toHaveBeenCalledWith(1)
    })
  })

  describe('Keyboard interactions', () => {
    it('applies value on Enter key', async () => {
      const handleChange = jest.fn()
      render(
        <QuantitySwitcher
          value={1}
          onDecrease={jest.fn()}
          onIncrease={jest.fn()}
          onChange={handleChange}
        />
      )

      const input = screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '5')
      await user.keyboard('{Enter}')

      expect(handleChange).toHaveBeenCalledWith(5)
    })

    it('allows only numeric input', async () => {
      render(
        <QuantitySwitcher
          value={1}
          onDecrease={jest.fn()}
          onIncrease={jest.fn()}
        />
      )

      const input = screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, 'abc123def')

      // Only numeric characters should be in the input
      expect(input).toHaveValue('123')
    })
  })

  describe('Value synchronization', () => {
    it('updates input value when prop value changes', () => {
      const { rerender } = render(
        <QuantitySwitcher
          value={1}
          onDecrease={jest.fn()}
          onIncrease={jest.fn()}
        />
      )

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveValue('1')

      rerender(
        <QuantitySwitcher
          value={5}
          onDecrease={jest.fn()}
          onIncrease={jest.fn()}
        />
      )

      expect(input).toHaveValue('5')
    })
  })
})
