import { useState, useRef, useEffect, useCallback } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { validateQuantity } from './quantity-utils'

interface UseQuantityInputOptions {
  value: number
  onChange?: (newValue: number) => void
  min: number
  max?: number
}

interface UseQuantityInputReturn {
  inputValue: string
  inputRef: React.RefObject<HTMLInputElement | null>
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void
  handleInputBlur: () => void
  handleInputKeyDown: (e: KeyboardEvent<HTMLInputElement>) => boolean
}

/**
 * Custom hook for managing quantity input state and validation
 * Handles input synchronization, validation, and keyboard interactions
 */
export function useQuantityInput({
  value,
  onChange,
  min,
  max,
}: UseQuantityInputOptions): UseQuantityInputReturn {
  const [inputValue, setInputValue] = useState<string>(value.toString())
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync input value when prop value changes (e.g., from server response)
  useEffect(() => {
    setInputValue(value.toString())
  }, [value])

  const setValidatedInputValue = useCallback(
    (nextValue: number) => {
      const validatedValue = validateQuantity(nextValue, min, max)

      // Keep the displayed value aligned with the validated quantity.
      setInputValue(validatedValue.toString())

      // Only notify consumers when validation resolves to a different value.
      if (validatedValue !== value) {
        onChange?.(validatedValue)
      }
    },
    [min, max, onChange, value]
  )

  const handleInputBlur = useCallback(() => {
    // On blur, commit the typed value through the validation path.
    setValidatedInputValue(parseInt(inputValue, 10))
  }, [inputValue, setValidatedInputValue])

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    // Only update local state - don't trigger onChange callback
    // This allows user to type freely without triggering updates
    setInputValue(e.target.value)
  }, [])

  const stepInputValue = useCallback(
    (delta: number) => {
      const numValue = parseInt(inputValue, 10)
      // Step from the live input value, falling back to min when invalid.
      setValidatedInputValue(Number.isNaN(numValue) ? min : numValue + delta)
    },
    [inputValue, min, setValidatedInputValue]
  )

  const handleInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>): boolean => {
      const delta = e.key === 'ArrowUp' ? 1 : e.key === 'ArrowDown' ? -1 : null

      if (delta !== null) {
        e.preventDefault()
        stepInputValue(delta)
        return true
      }

      // Handle Enter key - apply the value
      if (e.key === 'Enter') {
        e.preventDefault()
        inputRef.current?.blur() // This will trigger handleInputBlur
        return true
      }

      // Handle Escape key - cancel editing and reset to original value
      if (e.key === 'Escape') {
        e.preventDefault()
        setInputValue(value.toString())
        inputRef.current?.blur()
        return true
      }

      // Let numeric validation handle other keys
      return false
    },
    [stepInputValue, value]
  )

  return {
    inputValue,
    inputRef,
    handleInputChange,
    handleInputBlur,
    handleInputKeyDown,
  }
}
