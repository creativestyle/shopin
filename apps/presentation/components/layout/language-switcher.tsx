'use client'

import { useLanguageSwitcher } from '@/hooks/use-language-switcher'
import { LanguageTrigger } from './language-trigger'
import { LanguageListbox } from './language-listbox'

export function LanguageSwitcher() {
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
    <div className='relative'>
      <LanguageTrigger
        variant='compact'
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
          align='right'
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
  )
}
