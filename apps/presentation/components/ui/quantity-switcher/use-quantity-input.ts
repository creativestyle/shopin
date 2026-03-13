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

  const applyInputValue = useCallback(() => {
    const numValue = parseInt(inputValue, 10)
    const validatedValue = validateQuantity(numValue, min, max)

    // Update input display to match validated value
    setInputValue(validatedValue.toString())

    // Only trigger onChange if value actually changed
    if (onChange && validatedValue !== value) {
      onChange(validatedValue)
    } else if (validatedValue === value) {
      // Sync with prop value if no change needed
      setInputValue(value.toString())
    }
  }, [inputValue, min, max, onChange, value])

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    // Only update local state - don't trigger onChange callback
    // This allows user to type freely without triggering updates
    setInputValue(e.target.value)
  }, [])

  const handleInputBlur = useCallback(() => {
    // On blur, apply the input value
    applyInputValue()
  }, [applyInputValue])

  const handleInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>): boolean => {
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
    [value]
  )

  return {
    inputValue,
    inputRef,
    handleInputChange,
    handleInputBlur,
    handleInputKeyDown,
  }
}
