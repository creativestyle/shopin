'use client'

import type { MouseEvent, KeyboardEvent, RefObject } from 'react'
import { useTranslations } from 'next-intl'
import type { Locale } from '@config/constants'
import { cn } from '@/lib/utils'
import { FLAG_COMPONENTS } from './flag-components'
import ChevronDownIcon from '@/public/icons/chevron-down.svg'

type Props = {
  variant: 'compact' | 'labeled'
  currentLanguage: Locale | undefined
  isOpen: boolean
  isPending: boolean
  buttonRef: RefObject<HTMLButtonElement | null>
  listboxId: string
  onClick: (e: MouseEvent) => void
  onKeyDown: (e: KeyboardEvent) => void
}

export function LanguageTrigger({
  variant,
  currentLanguage,
  isOpen,
  isPending,
  buttonRef,
  listboxId,
  onClick,
  onKeyDown,
}: Props) {
  const t = useTranslations('languageSwitcher')
  const CurrentFlag = currentLanguage
    ? FLAG_COMPONENTS[currentLanguage.urlPrefix]
    : null

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      onKeyDown={onKeyDown}
      disabled={isPending}
      aria-haspopup='listbox'
      aria-expanded={isOpen}
      aria-controls={listboxId}
      aria-busy={isPending}
      aria-label={
        variant === 'compact'
          ? t('ariaLabel')
          : t('current', { language: currentLanguage?.nativeName ?? '' })
      }
      className={cn(
        'flex items-center lord-of-the-focus-ring rounded-lg transition-colors hover:bg-gray-100',
        {
          'gap-1 p-1': variant === 'compact',
          'gap-2 border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900':
            variant === 'labeled',
        }
      )}
    >
      {CurrentFlag && (
        <CurrentFlag
          aria-hidden={true}
          className='h-4 w-5'
        />
      )}
      {variant === 'compact' && (
        <span className='sr-only'>
          {currentLanguage
            ? t('current', { language: currentLanguage.nativeName })
            : ''}
        </span>
      )}
      {variant === 'labeled' && (
        <>
          <span>{currentLanguage?.nativeName}</span>
          <ChevronDownIcon
            aria-hidden={true}
            className={cn('size-4 transition-transform', {
              'rotate-180': isOpen,
            })}
          />
        </>
      )}
    </button>
  )
}
