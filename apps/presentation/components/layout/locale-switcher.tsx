'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'
import { useOutsideClick } from '@/hooks/use-outside-click'
import { cn } from '@/lib/utils'
import {
  LANGUAGE_CONFIG,
  URL_PREFIXES,
  SupportedLanguage,
} from '@config/constants'
import FlagDE from '../../public/icons/flag-de.svg'
import FlagUS from '../../public/icons/flag-us.svg'

const FLAG_COMPONENTS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  en: FlagUS,
  de: FlagDE,
}

const locales = Object.entries(URL_PREFIXES).map(([rfcCode, urlPrefix]) => ({
  code: urlPrefix,
  ...LANGUAGE_CONFIG[rfcCode as SupportedLanguage],
}))

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useOutsideClick(
    listRef,
    () => {
      setIsOpen(false)
      setFocusedIndex(-1)
    },
    isOpen
  )

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (
        event.key === 'Enter' ||
        event.key === ' ' ||
        event.key === 'ArrowDown'
      ) {
        event.preventDefault()
        setIsOpen(true)
        setFocusedIndex(0)
      }
      return
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        setIsOpen(false)
        setFocusedIndex(-1)
        buttonRef.current?.focus()
        break
      case 'ArrowDown':
        event.preventDefault()
        setFocusedIndex((prev) => (prev + 1) % locales.length)
        break
      case 'ArrowUp':
        event.preventDefault()
        setFocusedIndex((prev) => (prev - 1 + locales.length) % locales.length)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (focusedIndex >= 0) {
          const focusedLocale = locales[focusedIndex]
          router.push(`/${focusedLocale.code}`)
          setIsOpen(false)
          setFocusedIndex(-1)
        }
        break
    }
  }

  const currentLocale = locales.find((l) => l.code === locale)
  const CurrentFlag = currentLocale ? FLAG_COMPONENTS[currentLocale.code] : null

  return (
    <div className='relative'>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        onKeyDown={handleKeyDown}
        aria-haspopup='listbox'
        aria-expanded={isOpen}
        aria-label={`Select language. Current language: ${currentLocale?.name}`}
        className='flex items-center gap-2 lord-of-the-focus-ring rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900'
      >
        {CurrentFlag && <CurrentFlag className='h-4 w-5' />}
        <span>{currentLocale?.name}</span>
        <svg
          className={cn('size-4 transition-transform', {
            'rotate-180': isOpen,
          })}
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          aria-hidden='true'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M19 9l-7 7-7-7'
          />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={listRef}
          role='listbox'
          aria-label='Language options'
          className='absolute top-full left-0 z-50 mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg'
        >
          {locales.map((loc, index) => {
            const LocaleFlag = FLAG_COMPONENTS[loc.code]
            return (
              <Link
                key={loc.code}
                href={`/${loc.code}`}
                onClick={(e) => {
                  e.preventDefault()
                  setIsOpen(false)
                  router.push(`/${loc.code}`)
                }}
                role='option'
                aria-selected={loc.code === locale}
                tabIndex={-1}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors first:rounded-t-md last:rounded-b-md hover:bg-gray-100 focus:bg-blue-50 focus:text-blue-700',
                  {
                    'bg-gray-50 font-medium': loc.code === locale,
                    'bg-blue-50 text-blue-700': index === focusedIndex,
                  }
                )}
              >
                {LocaleFlag && <LocaleFlag className='h-4 w-5' />}
                <span>{loc.name}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
