'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import PasswordOnIcon from '@/public/icons/password-on.svg'
import PasswordOffIcon from '@/public/icons/password-off.svg'
import { TextInput, TextInputProps } from './text-input'

/**
 * Client wrapper only for toggling password visibility
 * Kept separate to preserve SSR for TextInput
 */
function PasswordInput({ ...props }: TextInputProps) {
  const [isVisible, setIsVisible] = useState(false)
  const t = useTranslations('common')
  const toggleAriaLabel = isVisible ? t('hidePassword') : t('showPassword')

  return (
    <TextInput
      {...props}
      type={isVisible ? 'text' : 'password'}
      endAdornment={
        <button
          type='button'
          aria-label={toggleAriaLabel}
          className='flex size-8 cursor-pointer items-center justify-center rounded-full [&:hover>svg]:fill-gray-950'
          onClick={() => setIsVisible((v) => !v)}
        >
          {isVisible ? (
            <PasswordOffIcon className='size-6 shrink-0 fill-gray-500' />
          ) : (
            <PasswordOnIcon className='size-6 shrink-0 fill-gray-500' />
          )}
        </button>
      }
    />
  )
}

export { PasswordInput }
