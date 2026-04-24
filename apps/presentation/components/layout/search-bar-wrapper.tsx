'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { SearchPopup } from './search-popup'
import SearchIcon from '@/public/icons/search.svg'

export function SearchBarWrapper() {
  const t = useTranslations('common')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <>
      <button
        type='button'
        onClick={() => setIsSearchOpen(true)}
        className='relative flex h-12 w-full cursor-pointer items-center gap-3 rounded-full bg-gray-100 px-4'
      >
        <span className='size-6 flex-shrink-0 text-gray-500'>
          <SearchIcon />
        </span>
        <span className='text-sm leading-normal font-normal text-gray-500'>
          {t('searchPlaceholder')}
        </span>
      </button>
      <SearchPopup
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
      />
    </>
  )
}
