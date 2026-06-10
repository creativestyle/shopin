'use client'

import React from 'react'
import { IMaskInput } from 'react-imask'
import IMask from 'imask'
import { TextInput, type TextInputProps } from './text-input'

const MASK = 'dd-mm-yyyy'

// Reorder segments between ISO (YYYY-MM-DD) and display (DD-MM-YYYY) formats.
function isoToDisplay(v: string): string {
  const [y, m, d] = v.split('-')
  return d && m && y ? `${d}-${m}-${y}` : v
}

function displayToIso(v: string): string {
  const [d, m, y] = v.split('-')
  return d && m && y ? `${y}-${m}-${d}` : v
}

const DATE_BLOCKS = {
  dd: { mask: IMask.MaskedRange, from: 1, to: 31 },
  mm: { mask: IMask.MaskedRange, from: 1, to: 12 },
  yyyy: { mask: IMask.MaskedRange, from: 1900, to: 2099 },
} as const

type DateInputProps = Omit<TextInputProps, 'type' | 'inputMode' | 'pattern'>

/** Masked date input (dd - mm - yyyy). */
function buildOverlaySuffix(mask: string, val?: string) {
  const v = String(val ?? '')
  return mask.slice(v.length)
}

function DateInput({
  id,
  name,
  value,
  onChange,
  defaultValue,
  ...rest
}: DateInputProps) {
  const [internalValue, setInternalValue] = React.useState(() =>
    String(defaultValue ?? '')
  )

  const isControlled = value !== undefined
  const rawValue = isControlled ? (value as string) : internalValue
  // Normalise to display format so IMask always receives dd-mm-yyyy.
  const currentValue = rawValue.match(/^\d{4}-\d{2}-\d{2}$/)
    ? isoToDisplay(rawValue)
    : rawValue
  const overlayText = buildOverlaySuffix(MASK, currentValue)
  return (
    <TextInput
      id={id}
      asChild
      placeholder={MASK}
      overlay={
        !!currentValue && (
          <div className='pointer-events-none absolute inset-0 top-4.5 flex items-center px-4'>
            {/* Invisible prefix to reserve exact width of typed value so suffix aligns */}
            <span className='invisible text-base/normal font-normal'>
              {currentValue}
            </span>
            <span className='text-base/normal font-normal text-gray-400'>
              {overlayText}
            </span>
          </div>
        )
      }
      {...rest}
    >
      <IMaskInput
        id={id}
        mask={MASK}
        blocks={DATE_BLOCKS}
        inputMode='numeric'
        value={currentValue}
        onAccept={(val: unknown) => {
          const displayVal = typeof val === 'string' ? val : String(val ?? '')
          // Emit ISO (YYYY-MM-DD) when complete, display string otherwise.
          const emitVal =
            displayVal.length === MASK.length
              ? displayToIso(displayVal)
              : displayVal
          if (onChange) {
            onChange({
              target: { name: name ?? id, value: emitVal },
              currentTarget: { value: emitVal },
            } as unknown as React.ChangeEvent<HTMLInputElement>)
          }
          if (!isControlled) {
            setInternalValue(emitVal)
          }
        }}
      />
    </TextInput>
  )
}

export { DateInput }
