'use client'
import * as React from 'react'
import { cn } from '../../lib/utils'
import SearchIcon from '../../public/icons/search.svg'

interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  className?: string
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder,
  onSearch,
  className,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('')

  const handleSearch = () => {
    onSearch?.(searchQuery)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div
      className={cn(
        'relative flex h-12 w-full items-center gap-3 rounded-full bg-gray-100 px-4',
        className
      )}
    >
      <div className='size-6 flex-shrink-0 text-gray-500'>
        <SearchIcon />
      </div>
      <input
        type='text'
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label='Search'
        className='w-full cursor-text border-none bg-transparent text-sm leading-normal font-normal text-gray-500 outline-none placeholder:text-gray-500'
      />
    </div>
  )
}
