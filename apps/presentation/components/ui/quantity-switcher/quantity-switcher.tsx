'use client'

import PlusIcon from '@/public/icons/plus.svg'
import MinusIcon from '@/public/icons/minus.svg'
import { cn } from '@/lib/utils'
import { useQuantityInput } from './use-quantity-input'
import { QuantityButton } from './quantity-button'
import { handleNumericKeyDown } from './keyboard-utils'

interface QuantitySwitcherProps {
  value: number
  onDecrease: () => void
  onIncrease: () => void
  onChange?: (newValue: number) => void
  disabled?: boolean
  min?: number
  max?: number
  className?: string
  ariaLabel?: string
}

export function QuantitySwitcher({
  value,
  onDecrease,
  onIncrease,
  onChange,
  disabled = false,
  min = 1,
  max,
  className,
  ariaLabel = 'Quantity',
}: QuantitySwitcherProps) {
  const {
    inputValue,
    inputRef,
    handleInputChange,
    handleInputBlur,
    handleInputKeyDown,
  } = useQuantityInput({
    value,
    onChange,
    min,
    max,
  })

  const canDecrease = !disabled && value > min
  const canIncrease = !disabled && (max === undefined || value < max)

  const decreaseValue = Math.max(min, value - 1)
  const increaseValue = max !== undefined ? Math.min(max, value + 1) : value + 1

  return (
    <div
      className={cn(
        'relative w-25 rounded-full border border-solid border-gray-300 bg-gray-50',
        {
          'h-12': !className?.includes('h-'),
        },
        className
      )}
      role='group'
      aria-label={ariaLabel}
    >
      <QuantityButton
        onClick={onDecrease}
        disabled={!canDecrease}
        ariaLabel={`${ariaLabel}: decrease to ${decreaseValue}`}
        position='left'
      >
        <MinusIcon
          className='h-full w-full text-gray-700'
          aria-hidden='true'
        />
      </QuantityButton>

      <input
        ref={inputRef}
        type='text'
        inputMode='numeric'
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={(e) => handleNumericKeyDown(e, handleInputKeyDown)}
        disabled={disabled}
        className={cn(
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          'w-8 border-0 bg-transparent outline-none',
          'text-center text-base font-normal text-gray-700',
          'leading-6',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'rounded focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 focus-visible:outline-none'
        )}
        aria-label={`${ariaLabel}: current value is ${value}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        role='spinbutton'
        min={min}
        max={max}
      />

      <QuantityButton
        onClick={onIncrease}
        disabled={!canIncrease}
        ariaLabel={`${ariaLabel}: increase to ${increaseValue}`}
        position='right'
      >
        <PlusIcon
          className='h-full w-full text-gray-700'
          aria-hidden='true'
        />
      </QuantityButton>
    </div>
  )
}
