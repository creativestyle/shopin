'use client'

import { useTranslations } from 'next-intl'
import { useLanguageSwitcher } from '@/hooks/use-language-switcher'
import { LanguageTrigger } from '@/components/layout/language-trigger'
import { LanguageListbox } from '@/components/layout/language-listbox'

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

  return (
    <div className='space-y-4'>
      <h3 className='text-sm leading-tight font-bold text-gray-900'>
        {t('footerTitle')}
      </h3>
      <div className='relative'>
        <LanguageTrigger
          variant='labeled'
          currentLanguage={currentLanguage}
          isOpen={isOpen}
          isPending={isPending}
          buttonRef={buttonRef}
          listboxId={listboxId}
          onClick={toggle}
          onKeyDown={onButtonKeyDown}
        />
        {isOpen && (
          <LanguageListbox
            align='left'
            languages={languages}
            currentLanguage={currentLanguage}
            focusedIndex={focusedIndex}
            listRef={listRef}
            listboxId={listboxId}
            activeOptionId={activeOptionId}
            onSelect={select}
            onKeyDown={onListKeyDown}
          />
        )}
      </div>
    </div>
  )
}
