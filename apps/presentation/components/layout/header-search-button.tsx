'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import SearchIcon from '../../public/icons/search.svg'
import { SearchPopup } from './search-popup'

export function HeaderSearchButton() {
  const t = useTranslations('userMenu')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsSearchOpen(true)}
        className='p-1 text-gray-900 hover:bg-gray-100 hover:text-primary'
      >
        <SearchIcon className='size-6' />
        <span className='sr-only'>{t('search')}</span>
      </button>
      <SearchPopup
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
      />
    </>
  )
}
