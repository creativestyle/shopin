'use client'

import type { KeyboardEvent, RefObject } from 'react'
import { useTranslations } from 'next-intl'
import type { Locale } from '@config/constants'
import { cn } from '@/lib/utils'
import { FLAG_COMPONENTS } from './flag-components'

type Props = {
  align: 'left' | 'right'
  languages: Locale[]
  currentLanguage: Locale | undefined
  focusedIndex: number
  listRef: RefObject<HTMLDivElement | null>
  listboxId: string
  activeOptionId: string | undefined
  onSelect: (prefix: string) => void
  onKeyDown: (e: KeyboardEvent) => void
}

export function LanguageListbox({
  align,
  languages,
  currentLanguage,
  focusedIndex,
  listRef,
  listboxId,
  activeOptionId,
  onSelect,
  onKeyDown,
}: Props) {
  const t = useTranslations('languageSwitcher')

  return (
    <div
      ref={listRef}
      id={listboxId}
      role='listbox'
      aria-label={t('ariaLabel')}
      aria-activedescendant={activeOptionId}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className={cn(
        'absolute top-full z-50 mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg',
        { 'right-0': align === 'right', 'left-0': align === 'left' }
      )}
    >
      {languages.map((lang, index) => {
        const LangFlag = FLAG_COMPONENTS[lang.urlPrefix]
        const isActive = lang.urlPrefix === currentLanguage?.urlPrefix
        return (
          <div
            key={lang.language}
            id={`${listboxId}-option-${index}`}
            role='option'
            aria-selected={isActive}
            onClick={() => onSelect(lang.urlPrefix)}
            className={cn(
              'flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm transition-colors first:rounded-t-md last:rounded-b-md hover:bg-gray-100',
              {
                'bg-gray-50 font-medium': isActive,
                'bg-blue-50 text-blue-700': index === focusedIndex,
              }
            )}
          >
            {LangFlag && (
              <LangFlag
                aria-hidden={true}
                className='h-4 w-5'
              />
            )}
            <span>{lang.nativeName}</span>
          </div>
        )
      })}
    </div>
  )
}
