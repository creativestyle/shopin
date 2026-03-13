'use client'

import { SearchBar } from '../ui/search-bar'

export function SearchBarWrapper() {
  const handleSearch = (_query: string) => {
    // Stub: search not implemented
  }

  return (
    <SearchBar
      placeholder='Suche...'
      onSearch={handleSearch}
      className='w-full'
    />
  )
}
