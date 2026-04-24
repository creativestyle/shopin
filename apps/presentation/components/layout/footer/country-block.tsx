'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useLanguageSwitcher } from '@/hooks/use-language-switcher'
import { FLAG_COMPONENTS } from '@/components/layout/flag-components'
import ChevronDownIcon from '@/public/icons/chevron-down.svg'

export function CountryBlock() {
  const t = useTranslations('languageSwitcher')
  const {
    languages,
    currentLanguage,
    isOpen,
    isPending,
    focusedIndex,
    buttonRef,
    listRef,
    listboxId,
    activeOptionId,
    toggle,
    select,
    onButtonKeyDown,
    onListKeyDown,
  } = useLanguageSwitcher()

  const CurrentFlag = currentLanguage
    ? FLAG_COMPONENTS[currentLanguage.urlPrefix]
    : null

  return (
    <div className='space-y-4'>
      <h3 className='text-sm leading-tight font-bold text-gray-900'>
        {t('footerTitle')}
      </h3>
      <div className='relative'>
        <button
          ref={buttonRef}
          onClick={toggle}
          onKeyDown={onButtonKeyDown}
          disabled={isPending}
          aria-haspopup='listbox'
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-busy={isPending}
          aria-label={t('current', {
            language: currentLanguage?.nativeName ?? '',
          })}
          className='flex items-center gap-2 lord-of-the-focus-ring rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900'
        >
          {CurrentFlag && (
            <CurrentFlag
              aria-hidden={true}
              className='h-4 w-5'
            />
          )}
          <span>{currentLanguage?.nativeName}</span>
          <ChevronDownIcon
            aria-hidden={true}
            className={cn('size-4 transition-transform', {
              'rotate-180': isOpen,
            })}
          />
        </button>

        {isOpen && (
          <div
            ref={listRef}
            id={listboxId}
            role='listbox'
            aria-label={t('ariaLabel')}
            aria-activedescendant={activeOptionId}
            tabIndex={-1}
            onKeyDown={onListKeyDown}
            className='absolute top-full left-0 z-50 mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg'
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
                  onClick={() => select(lang.urlPrefix)}
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
        )}
      </div>
    </div>
  )
}
