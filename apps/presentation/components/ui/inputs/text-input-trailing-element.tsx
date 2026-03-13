import React from 'react'
import { cn } from '@/lib/utils'
import CheckmarkIcon from '@/public/icons/checkmark.svg'
import CloseIcon from '@/public/icons/close.svg'

type TrailingElementProps = {
  endAdornment?: React.ReactNode
  isValid: boolean
  isInvalid: boolean
}

export function TrailingElement({
  endAdornment,
  isValid,
  isInvalid,
}: TrailingElementProps) {
  let content: React.ReactNode | null = null

  if (endAdornment) {
    content = endAdornment
  } else if (isValid) {
    content = (
      <CheckmarkIcon
        className='size-6 rounded-full bg-green-600 p-1 text-white'
        aria-hidden='true'
      />
    )
  } else if (isInvalid) {
    content = (
      <CloseIcon
        className='size-6 rounded-full bg-red-600 p-1 text-white'
        aria-hidden='true'
      />
    )
  }

  if (!content) {
    return null
  }

  return (
    <span
      className={cn('absolute inset-y-0 right-4 flex items-center', {
        'pointer-events-auto': endAdornment,
        'pointer-events-none': !endAdornment,
      })}
    >
      {content}
    </span>
  )
}
