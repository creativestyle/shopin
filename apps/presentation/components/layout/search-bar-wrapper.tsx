'use client'

import { useState } from 'react'
import { SearchBar } from '../ui/search-bar'
import { SearchPopup } from './search-popup'

export function SearchBarWrapper() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <>
      <div
        onClick={() => setIsSearchOpen(true)}
        className='w-full cursor-pointer'
      >
        <SearchBar
          placeholder='Suche...'
          className='pointer-events-none w-full'
        />
      </div>
      <SearchPopup
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
      />
    </>
  )
}
